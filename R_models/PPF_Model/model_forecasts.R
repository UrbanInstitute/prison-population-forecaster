# FILE: 
#    model_forecasts.R
# PURPOSE: 
#    Define functions that take data on prison admissions, releases, and
#    population -- by state, offense category, and year -- and produce 
#    prison population forecaster forecasts 


# NOTES
#   *scenario = list of changes to admissions/length of stay by offense category
#     -takes the form of list(c("offensestring", pctchange, changetype))
#     -within each sublist:
#       -offensestring: offense category string
#       -pctchange: number between -1 and 1 indicating percent change
#       -changetype: either 1 or 2, flags whether this change applies to either: 
#           -admissions (==1) or 
#           -length of stay (==2)
#     -Ex: list(c("drugposs", -.5, 1), c("burglary", .2, 2))
#       -this scenario would model a 50% reduction in admissions for drug 
#        possession and a 20% increase in length of stay for burglary
#   *Notation used:
#       *n = prison population at year-end
#       *a = number of people admitted to prison in a year
#       *r = number of people released from prison in a year
#       *p = share of prior year's population remaining in prison after 1 year
#           p(y) = [n(y-1) - r(y)] / n(y-1)
#       *l = an estimate of length of stay based on p
#           l(y) = 1 / [1 - p(y)]


ExpandScenario <-function(scen.to.expand) {

  # Expands lists of scenarios that include umbrella offense categories (e.g., 
  # all drug offenses) by replacing each umbrella category scenario with 
  # individual scenarios for each subcategory under the umbrella
  #
  # Argument: 
  #   -scen.to.expand: list of one or more scenarios that might include umbrella
  #    categories
  #   
  # Returns: 
  #   -expanded list of scenarios where all scenarios featuring an umbrella 
  #    category are replaced by multiple scenarios representing each subcategory
  
  ExpandOne <- function(one.scenario) {
    
    # Expands one individual scenario
    # 
    # Argument:
    #   -one.scenario: One individual scenario
    #   
    # Returns:
    #   -expanded scenario
    
    # "violent" umbrella category expands to include assault, homicide, 
    # kidnapping, robbery, sexual assault, and other violent offenses
    if ("violent" %in% one.scenario[[1]]){
      expanded <- list(c("assault", one.scenario[[2]], one.scenario[[3]]), 
                       c("homicide", one.scenario[[2]], one.scenario[[3]]), 
                       c("kidnapping", one.scenario[[2]], one.scenario[[3]]), 
                       c("otherviol", one.scenario[[2]], one.scenario[[3]]), 
                       c("robbery", one.scenario[[2]], one.scenario[[3]]), 
                       c("sexassault", one.scenario[[2]], one.scenario[[3]]))
    
    # "drug" umbrella category expands to include possession, trafficking, and 
    # other drug offenses
    } else if ("drug" %in% one.scenario[[1]]) {
      expanded <- list(c("drugposs", one.scenario[[2]], one.scenario[[3]]), 
                       c("drugtraff", one.scenario[[2]], one.scenario[[3]]), 
                       c("otherdrug", one.scenario[[2]], one.scenario[[3]]))
    
    # "property" umbrella category expands to include arson, burglary, fraud, 
    # larceny, motor vehicle theft, and other property offenses
    } else if ("property" %in% one.scenario[[1]]){
      expanded <- list(c("arson", one.scenario[[2]], one.scenario[[3]]), 
                       c("burglary", one.scenario[[2]], one.scenario[[3]]), 
                       c("fraud", one.scenario[[2]], one.scenario[[3]]),
                       c("larceny", one.scenario[[2]], one.scenario[[3]]), 
                       c("mvtheft", one.scenario[[2]], one.scenario[[3]]), 
                       c("otherprop", one.scenario[[2]], one.scenario[[3]]))
    
    # "other" category expands to include DWI, weapons, and public order/other  
    } else if ("other" %in% one.scenario[[1]]){
      expanded <- list(c("dwi", one.scenario[[2]], one.scenario[[3]]), 
                       c("weapons", one.scenario[[2]], one.scenario[[3]]),
                       c("public_oth", one.scenario[[2]], one.scenario[[3]]))
    
    # "nonviolent" expands to include all drug, property, and public order   
    } else if ("nonviolent" %in% one.scenario[[1]]){
      expanded <- list(c("arson", one.scenario[[2]], one.scenario[[3]]), 
                       c("burglary", one.scenario[[2]], one.scenario[[3]]), 
                       c("drugposs", one.scenario[[2]], one.scenario[[3]]), 
                       c("drugtraff", one.scenario[[2]], one.scenario[[3]]), 
                       c("dwi", one.scenario[[2]], one.scenario[[3]]), 
                       c("fraud", one.scenario[[2]], one.scenario[[3]]), 
                       c("larceny", one.scenario[[2]], one.scenario[[3]]), 
                       c("mvtheft", one.scenario[[2]], one.scenario[[3]]), 
                       c("otherdrug", one.scenario[[2]], one.scenario[[3]]), 
                       c("otherprop", one.scenario[[2]], one.scenario[[3]]), 
                       c("public_oth", one.scenario[[2]], one.scenario[[3]]), 
                       c("weapons", one.scenario[[2]], one.scenario[[3]]))
      
    # if scenario isn't for umbrella category, returns input scenario as is
    } else {
      expanded <- list(one.scenario)
    }
    
    return(expanded)
  }
  
  # create list of expanded scenarios (one list for each original scenario from 
  # input scen.to.expand)
    expanded.list <- lapply(scen.to.expand, ExpandOne)  
  
  # unlist nested lists to produce list where each element is a scenario (rather 
  # than a list of scenarios)
    all.scenarios <- list()
    for (element in 1:length(expanded.list)){
      all.scenarios <- c(all.scenarios, expanded.list[[element]])
    }
  
  return(all.scenarios)
  
}


GetMultiplier<-function(offense, scen.mult, type) {
  
  # Given an offense category and a scenario, determine number that will be 
  # multiplied by original 2025 baseline estimate to produce 2025 estimate
  # with the forecast scenario applied
  # 
  # Arguments:
  #   -offense = offense category string
  #   -scen.mult = policy impact scenario
  #   -type ==1 to get admissions multiplier; ==2 for length of stay multiplier
  # 
  # Returns: 
  #   -multiplier that, when multiplied by 2025 baseline admissions or length of
  #    stay value, will produce new 2025 estimate with policy scenario applied
  #    
  # Note: With percent change bounded between -1 and 1, multiplier will be 
  # between 0 and 2
  
  # Offense cat is included in one or more scenarios within list
    if(offense %in% unlist(scen.mult)){ 
      
      # capture any sub-scenarios that affect "offense"
      relevant_scen<-scen.mult[sapply(scen.mult, function(x) offense %in% x)] 
      
      # Assign multiplier = (1 + pct change) from relevant scenario that 
      # matches the change type we want (either admissions or length of stay)
      
     
      # IF ONE RELEVANT SCENARIO (i.e. either admissions or LOS)
      if (length(relevant_scen)==1){ 
        if (relevant_scen[[1]][3]==type){  
          multiplier<-1+as.numeric(relevant_scen[[1]][2]) 
        } else {
          multiplier <- 1
        }

      # IF TWO RELEVANT SCENARIOS (i.e. both admissions and LOS )
      } else if (length(relevant_scen)==2){ 
        if (relevant_scen[[1]][3]==type){ 
          multiplier<-1+as.numeric(relevant_scen[[1]][2]) 
        } else if (relevant_scen[[2]][3]==type){ 
          multiplier<-1+as.numeric(relevant_scen[[2]][2]) 
        } else { 
          multiplier <- 1
        }
      }
    
  #CATEGORY IS NOT AFFECTED BY SCENARIO
    } else { 
      multiplier<-1 #this represents the baseline scenario
    }
      
  return(as.numeric(multiplier))
    
}


MergeAll <- function(x,y) {
  # merge together two data frames by "year" variable
  # Arguments:
  #   x and y are data frames
  # Returns:
  #   merged data frame
  merge(x, y, all=TRUE, by="year")
}


OffCatProjections <- function(offense, counts.st, scen.cat, details) {
  
  # Given an offense category, dataframe of admissions/releases/pop counts
  # for a state, and forecast scenario, produce offense-specific population 
  # projection with that scenario applied
  # 
  # Inputs:
  #   offense = offense category string
  #   counts.st = dataframe of counts for state
  #   scen.cat = scenario
  #   details = 0 to just return population projections; 1 to return all 
  #     variables including admissions, LOS
  #
  # Returns: Dataframe of projections for offense
  #   If details == 0, just returns year and n
  #   If details == 1, also returns a, p, l


  # Determine relevant years - first and last years of data reported by state
    lastyr <- max(counts.st$year)-1  #last year of real data
    firstyr <- min(counts.st$year)   #first year of real data
  
    
  # Depending on how many years were available, calculate population forecast
  
  # Five or more years available (lastyr - firstyr >= 4)
    if(lastyr-firstyr>=4) {
      
      firstyr.formean<-lastyr-4  #first year to be incorporated into projections
      
      # generate empty data frame from firstyr to 2025 as base for projections;
      # merge to counts data
        proj.base<-as.data.frame(firstyr:2025)
        names(proj.base)<-"year"
        proj<-merge(proj.base, subset(counts.st, counts.st$ppf_cat==offense), 
                    by="year", all.x=TRUE)
      
      # get scenario-dependent multiplier 
        a.multiplier<-GetMultiplier(offense, scen.mult=scen.cat, type=1) #adm
        l.multiplier<-GetMultiplier(offense, scen.mult=scen.cat, type=2) #los
      
      
      # calculate 2025 values for admissions (a) & LOS (l)
      
      # admissions
        # a.vals = values necessary to make calculation 
        # (a (admissions) in recent years)  
        a.vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr.formean, 
                       select=c("year", "a")) 
        # calculate percent change for each interval in most recent 5 years
        a.pc.1 <- (a.vals$a[2] - a.vals$a[1])/a.vals$a[1] #oldest year
        a.pc.2 <- (a.vals$a[3] - a.vals$a[2])/a.vals$a[2]
        a.pc.3 <- (a.vals$a[4] - a.vals$a[3])/a.vals$a[3]
        a.pc.4 <- (a.vals$a[5] - a.vals$a[4])/a.vals$a[4] #most recent year
        # calculate weighted mean of percent changes (x4, then adjusted by tanh)
        a.pct.chg <- tanh(weighted.mean(c(a.pc.1, a.pc.2, a.pc.3, a.pc.4),
                                        c(1, 2, 2, 3))*4)
        # apply a.pct.chg to weighted mean of values in recent years; 
        # apply multiplier to simulate change from policy scenario
        a.final<- a.multiplier*(weighted.mean(as.vector(a.vals$a), 
                                              c(1, 1, 2, 2, 3)) + 
                                  (a.pct.chg*weighted.mean(as.vector(a.vals$a),
                                                           c(1, 1, 2, 2, 3))))
      
      # length of stay
        # l.vals = values necessary to make calcuation (L in recent years)
        l.vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr.formean, 
                       select=c("year", "l"))
        # calculate percent change for each interval in most recent 5 years
        l.pc.1 <- (l.vals$l[2] - l.vals$l[1])/l.vals$l[1] #oldest year
        l.pc.2 <- (l.vals$l[3] - l.vals$l[2])/l.vals$l[2]
        l.pc.3 <- (l.vals$l[4] - l.vals$l[3])/l.vals$l[3]
        l.pc.4 <- (l.vals$l[5] - l.vals$l[4])/l.vals$l[4] #most recent year
        # calculate weighted mean of percent changes (x4, then adjusted by tanh)
        l.pct.chg <- tanh(weighted.mean(c(l.pc.1, l.pc.2, l.pc.3, l.pc.4), 
                                        c(1, 2, 2, 3))*4)
        # apply l.pct.chg to weighted mean of values in recent years; 
        # apply multiplier to simulate change from policy scenario
        l.final <- l.multiplier*(weighted.mean(as.vector(l.vals$l), 
                                               c(1, 1, 2, 2, 3)) + 
                                   (l.pct.chg*weighted.mean(as.vector(l.vals$l), 
                                                            c(1, 1, 2, 2, 3))))
      
      
      # generate intervening years using linear step between lastyr and 2025
      
      # last year of real data
        a.lastval<-proj$a[proj$year==lastyr]  
        l.lastval<-proj$l[proj$year==lastyr]
      
      # calculate step for equal interval between years 
        a.step<-(a.final-a.lastval)/(2025-lastyr) 
        l.step<-(l.final-l.lastval)/(2025-lastyr)
      
      # calculate intervening years using step between lastyr and 2025 
        proj$a[proj$year>lastyr]<-seq(from=a.lastval+a.step, to=a.final, 
                                      by=a.step) 
        proj$l[proj$year>lastyr]<-seq(from=l.lastval+l.step, to=l.final, 
                                      by=l.step)
      
      
      # convert l to p (used to calculate n)
        proj$p <- 1-(1/proj$l)
      
      
      # generate projected n's based on estimates for admissions and LOS

      proj$n<-(proj$nt*proj$p)+proj$a 
      
      for(i in (lastyr-firstyr+2):(2025-firstyr+1)){
        
        # n from prior year i-1 becomes nt for current year i
        proj$nt[[i]]<-proj$n[[i-1]]
        
        # Convert projections for a and p to n (population)
          # (a) when p>=0 (corresponding to LOS >= 1 year):
          #     n = (nt*p) + e
          # (b) when p<0 (corresponding to LOS < 1 year):
          #     n = a*l
        if(proj$p[[i]]>=0){ 
          proj$n[[i]]<-(proj$nt[[i]]*proj$p[[i]])+proj$a[[i]]
        }else if(proj$p[[i]]<0) {
            proj$n[[i]]<-proj$a[[i]]*proj$l[[i]]
        }
      }
    
  # Four years available (lastyr - firstyr == 3 )
      
    } else if (lastyr-firstyr==3) {
      
      firstyr.formean<-lastyr-3 # first year to be incorporated into projections
      
      # generate empty data frame from firstyr to 2025 as base for projections; 
      # merge to counts data
        proj.base<-as.data.frame(firstyr:2025)
        names(proj.base)<-"year"
        proj<-merge(proj.base, subset(counts.st, counts.st$ppf_cat==offense), 
                    by="year", all.x=TRUE)
      
      # get scenario-dependent multiplier
        a.multiplier<-GetMultiplier(offense, scen.mult=scen.cat, type=1)
        l.multiplier<-GetMultiplier(offense, scen.mult=scen.cat, type=2)
      
      # calculate 2025 values for admissions (a) & LOS (l)
      
      # admissions
        # a.vals = values necessary to make calculation 
        a.vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr.formean, 
                       select=c("year", "a")) 
        # calculate percent change for each interval in most recent 4 years
        a.pc.1 <- (a.vals$a[2] - a.vals$a[1])/a.vals$a[1] #oldest year
        a.pc.2 <- (a.vals$a[3] - a.vals$a[2])/a.vals$a[2]
        a.pc.3 <- (a.vals$a[4] - a.vals$a[3])/a.vals$a[3]
        # calculate weighted mean of percent changes (x3, then adjusted by tanh)
        a.pct.chg <- tanh(weighted.mean(c(a.pc.1, a.pc.2, a.pc.3), 
                                        c(2, 2, 3))*4)
        # apply a.pct.chg to weighted mean of values in recent years; 
        # apply multiplier to simulate change from policy scenario
        a.final<- a.multiplier*(weighted.mean(as.vector(a.vals$a), 
                                              c(1, 2, 2, 3)) + 
                                  (a.pct.chg*weighted.mean(as.vector(a.vals$a), 
                                                           c(1, 2, 2, 3))))
      
      # length of stay
        # l.vals = values necessary to make calcuation (L in recent years)
        l.vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr.formean, 
                       select=c("year", "l"))
        # calculate percent change for each interval in most recent 4 years
        l.pc.1 <- (l.vals$l[2] - l.vals$l[1])/l.vals$l[1] #oldest year
        l.pc.2 <- (l.vals$l[3] - l.vals$l[2])/l.vals$l[2]
        l.pc.3 <- (l.vals$l[4] - l.vals$l[3])/l.vals$l[3]
        # calculate weighted mean of percent changes (x3, then adjusted by tanh)
        l.pct.chg <- tanh(weighted.mean(c(l.pc.1, l.pc.2, l.pc.3), 
                                        c(2, 2, 3))*4)
        # apply l.pct.chg to weighted mean of values in recent years; 
        # apply multiplier to simulate change from policy scenario
        l.final <- l.multiplier*(weighted.mean(as.vector(l.vals$l), 
                                               c( 1, 2, 2, 3)) + 
                                   (l.pct.chg*weighted.mean(as.vector(l.vals$l), 
                                                            c(1, 2, 2, 3))))
      
      
      # generate intervening years using linear step between lastyr and 2025
      
      # last year of real data
        a.lastval<-proj$a[proj$year==lastyr]  
        l.lastval<-proj$l[proj$year==lastyr]
      
      # calculate step for equal interval between years 
        a.step<-(a.final-a.lastval)/(2025-lastyr) 
        l.step<-(l.final-l.lastval)/(2025-lastyr)
      
      # calculate intervening years using step between lastyr and 2025 
        proj$a[proj$year>lastyr]<-seq(from=a.lastval+a.step, to=a.final, 
                                      by=a.step) 
        proj$l[proj$year>lastyr]<-seq(from=l.lastval+l.step, to=l.final, 
                                      by=l.step)
      
      
      # convert l to p (used to calculate N (stock population))
        proj$p <- 1-(1/proj$l)
      
      #generate projected n's based on estimates for admissions and LOS
        proj$n<-(proj$nt*proj$p)+proj$a 
      
        for(i in (lastyr-firstyr+2):(2025-firstyr+1)){
          
          # n from year i-1 becomes nt for year i
          proj$nt[[i]]<-proj$n[[i-1]]
          
          # Convert projections for a and p to n (population)
          
          # (a) when p>=0 (corresponding to LOS >= 1 year):
          #     n = (nt*p) + a
          # (b) when p<0 (corresponding to LOS < 1 year):
          #     n = a*l
          if(proj$p[[i]]>=0){ 
            proj$n[[i]]<-(proj$nt[[i]]*proj$p[[i]])+proj$a[[i]]
          }else if(proj$p[[i]]<0) {
            proj$n[[i]]<-proj$a[[i]]*proj$l[[i]]
          }
          
        }
  
   # Three years available (lastyr - firstyr ==2)
      
    } else if (lastyr-firstyr==2) {
      firstyr.formean<-lastyr-2   # first year of data to be incorporated 
      
      # generate empty data frame from firstyr to 2025 as base for projections; 
      # merge to counts data
        proj.base<-as.data.frame(firstyr:2025)
        names(proj.base)<-"year"
        proj<-merge(proj.base, subset(counts.st, counts.st$ppf_cat==offense), 
                    by="year", all.x=TRUE)
        
      # get scenario-dependent multiplier
        a.multiplier<-GetMultiplier(offense, scen.mult=scen.cat, type=1)
        l.multiplier<-GetMultiplier(offense, scen.mult=scen.cat, type=2)
      
      # calculate 2025 values for admissions (a) & LOS (l)
      
      # admissions
        # a.vals = values necessary to make calculation  
        a.vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr.formean, 
                       select=c("year", "a")) 
        # calculate percent change for each interval in most recent 3 years
        a.pc.1 <- (a.vals$a[2] - a.vals$a[1])/a.vals$a[1] #oldest year
        a.pc.2 <- (a.vals$a[3] - a.vals$a[2])/a.vals$a[2]
        # calculate weighted mean of percent changes (x2, then adjusted by tanh)
        a.pct.chg <- tanh(weighted.mean(c(a.pc.1, a.pc.2), c(2, 3))*4)
        # apply a.pct.chg to weighted mean of values in recent years; 
        # apply multiplier to simulate change from policy scenario
        a.final<- a.multiplier*(weighted.mean(as.vector(a.vals$a), 
                                              c(2, 2, 3)) + 
                                  (a.pct.chg*weighted.mean(as.vector(a.vals$a), 
                                                           c(2, 2, 3))))
      
      # LOS
        # l.vals = values necessary to make calcuation (L in recent years)
        l.vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr.formean, 
                       select=c("year", "l"))
        # calculate percent change for each interval in most recent 3 years
        l.pc.1 <- (l.vals$l[2] - l.vals$l[1])/l.vals$l[1] #oldest year
        l.pc.2 <- (l.vals$l[3] - l.vals$l[2])/l.vals$l[2]
        # calculate weighted mean of percent changes (x2, then adjusted by tanh)
        l.pct.chg <- tanh(weighted.mean(c(l.pc.1, l.pc.2), c(2, 3))*4)
        # apply l.pct.chg to weighted mean of values in recent years; 
        # apply multiplier to simulate change from policy scenario
        l.final <- l.multiplier*(weighted.mean(as.vector(l.vals$l), 
                                               c(2, 2, 3)) + 
                                   (l.pct.chg*weighted.mean(as.vector(l.vals$l), 
                                                            c(2, 2, 3))))
      
      
      # generate intervening years using linear step between lastyr and 2025
      
      # last year of real data
        a.lastval<-proj$a[proj$year==lastyr]  
        l.lastval<-proj$l[proj$year==lastyr]
      
      # calculate step for equal interval between years 
        a.step<-(a.final-a.lastval)/(2025-lastyr) 
        l.step<-(l.final-l.lastval)/(2025-lastyr)
      
      # calculate intervening years using step between lastyr and 2025
        proj$a[proj$year>lastyr]<-seq(from=a.lastval+a.step, to=a.final, 
                                      by=a.step) 
        proj$l[proj$year>lastyr]<-seq(from=l.lastval+l.step, to=l.final, 
                                      by=l.step)
      
      
      # convert l to p (used to calculate N (stock population))
        proj$p <- 1-(1/proj$l)
      
      
      # generate projected n's based on estimates for admissions and LOS

      proj$n<-(proj$nt*proj$p)+proj$a 
      
      for(i in (lastyr-firstyr+2):(2025-firstyr+1)){
        
        # n from year i-1 becomes nt for year i
        proj$nt[[i]]<-proj$n[[i-1]]
        
        # Convert projections for a and p to n (population)
        
        # (a) when p>=0 (corresponding to LOS >= 1 year):
        #   n = (nt*p) + a
        # (b) when p<0 (corresponding to LOS < 1 year):
        #   n = a*l
        if(proj$p[[i]]>=0){ 
          proj$n[[i]]<-(proj$nt[[i]]*proj$p[[i]])+proj$a[[i]]
        }else if(proj$p[[i]]<0) {
          proj$n[[i]]<-proj$a[[i]]*proj$l[[i]]
        }
        
    }
  } 
    
    
 
    # generate output dataframe conditional on details (# of vars required)
    if (details==0){
      final.projections<-subset(proj, select=c("year", "n"))
      names(final.projections)<-c("year", paste(offense, "n", sep="_"))
      return(final.projections)
      
    } else{
      final.projections.d<-subset(proj, select=c("year", "a","l","p","n"))
      names(final.projections.d)<-c("year", paste(offense, "a", sep="_"), 
                                    paste(offense, "l", sep="_"), 
                                    paste(offense, "p", sep="_"), 
                                    paste(offense, "n", sep="_"))
      return(final.projections.d)
    }
    

}   


GetBaselineLastYr <- function(ST) {
  
  # Given state name, produce baseline population projections through 2025 and
  # race/ethnicity estimates for the baseline and the last yr of available data
  # 
  # Argument:
  #   -ST = two-letter state code string (e.g., "MD")
  # Returns: 
  #   -Dataframe of baseline population projections 
  #   
  # Note: This function does not depend on a specific forecast scenario

  # Create subset of counts file with only counts for ST 
  STfile <- subset(counts.allstates, counts.allstates$state==ST)

  state.offenses<-unique(STfile$ppf_cat) # all valid offense cats in ST's data
  lastyr <- max(STfile$year)-1 # last year of valid data in ST 
  
  # Get baseline projection counts (p.b) in each category
  # Note: list(c("x", 0, 0)) represents the baseline scenario: 
  # it will lead to all multipliers being 1 (no change)
    p.b <- lapply(state.offenses, OffCatProjections, counts.st=STfile, 
                  scen.cat=list(c("x",0,0)), details=0) 
  
    for (i in 1:length(p.b)) { #add variable indicating ppf_cat
      p.b[[i]]$ppf_cat <- paste(gsub("_n", "", names(p.b[[i]])[2]))
      names(p.b[[i]])[2] <- "n"
    }

  #Merge baseline counts to Race/Ethnicity percentages at two key points: 
    #(1) 2025
      re.2025 <- merge(Reduce(rbind, lapply(p.b, subset, year==2025)), 
                     subset(re, state==ST, by="ppf_cat"))
    #(2) last year available in state
      re.ly <- merge(Reduce(rbind, 
                          lapply(p.b, function (x) subset(x, x$year==lastyr))),  
                     subset(re, state==ST, by="ppf_cat"))
  
  # Multiply n in each category by R/E percentages;sum up N's allocated to each 
  # R/E category (this creates estimates of number of people in each R/E 
  # category in overall prison population)
    re.2025.n <- matrix(colSums(as.data.frame(lapply(re.2025[, 
      c("white", "black", "hispanic", "native", "asian", "hawaiian", "other")],
                                              function(x, y) x * y,
                                              y = re.2025$n))), nrow=7, ncol=1)
    re.ly.n <- matrix(colSums(as.data.frame(lapply(re.ly[, 
      c("white", "black", "hispanic", "native", "asian", "hawaiian", "other")],
                                                function(x, y) x * y,
                                                y = re.ly$n))), nrow=7, ncol=1)
  #Calculate estimated share of people in each R/E category in the forecast
  #population, both in 2025 and in the last year of available data
  #(estimated N for each R/E cat divided by total sum of N)
    re.2025.pct <- as.data.frame(re.2025.n/sum(re.2025.n))
    re.ly.pct <- as.data.frame(re.ly.n/sum(re.ly.n))
  
  
  #Generate merged dataframe with all offense categories' population projections
    
    for (i in 1:length(p.b)) { 
      names(p.b[[i]])[2] <- paste(p.b[[i]][1,3])
    }
    
    p.b.m<-Reduce(MergeAll, lapply(p.b, function (x) x<-x[,1:2]))
    
  #Add together all offense categories to get total baseline population estimate
    p.b.m$b<-rowSums(p.b.m[,-1], na.rm=TRUE) 
    p.b.m$val <- lapply(p.b.m$year, function(x) paste("n", x, sep="_"))
    p.b.m <- subset(p.b.m, select=c("val", "b"))
    p.b.m$val <- as.character(p.b.m$val)
    p.b.m$ly<-NA
  
  #Generate final dataframe; combine R/E percentages and population projections
  basel.df <- cbind(c("re_w", "re_b", "re_h", "re_n", "re_a", "re_hi", "re_o"), 
             re.2025.pct, re.ly.pct)
  names(basel.df) <- c("val", "b", "ly")
  basel.df$val <- as.character(basel.df$val)
  basel.df <- rbind(basel.df, p.b.m)
  
  basel.df$b <- as.numeric(basel.df$b)
  basel.df$ly <- as.numeric(basel.df$ly)
  
  return(basel.df)
  
}


StateProjections <- function(ST, scenarios.list) { 
  # Given state name and list of scenarios, produce forecaster population and 
  # race/ethnicity estimates
  # 
  # Argument:
  #   -ST = two-letter state code string (e.g., "MD")
  #   -scenarios.list = a list of policy scenarios
  #       in the format list(c("offense", pctchg, chgtype))
  # Returns: 
  #   -Dataframe of forecaster population projections, including baseline values 
  #   
  # Note: This function does not depend on a specific forecast scenario
  
  # Create subset of counts file with only counts for ST 
  STfile <- subset(counts.allstates, counts.allstates$state==ST)
  
  state.offenses<-unique(STfile$ppf_cat) # all valid offense cats in ST's data
  
  #expand scenarios if they include umbrella category (e.g., violent or 
  #nonviolent)
  all.scenarios <-ExpandScenario(scenarios.list) 
  
  lastyr <- max(STfile$year)-1 # last yr of available data 
  
  
  # Get forecast population projection counts by offense, with scenario applied
  p.f<-lapply(state.offenses, OffCatProjections, counts.st=STfile, 
              scen.cat=all.scenarios, details=0) 
  
  
  #Calculate race/ethnicity percentages in 2025
  
  #add variable indicating ppf_cat to prepare for merge to race/ethnicity data  
  for (i in 1:length(p.f)){ 
    p.f[[i]]$ppf_cat <- paste(gsub("_n", "", names(p.f[[i]])[2]))
    names(p.f[[i]])[2] <- "n"
  }
  
  # Combine 2025 population projections in each category; merge to R/E data
  re.2025<- merge(Reduce(rbind, lapply(p.f, subset, year==2025)), 
                  subset(re, state==ST, by="ppf_cat"))
  
  #Multiply n in each category by R/E percentages; 
  #sum up N allocated to each R/E category
  re.2025.n <- matrix(colSums(as.data.frame(lapply(re.2025[, 
      c("white", "black", "hispanic", "native", "asian", "hawaiian", "other")],
                                              function(x, y) x * y,
                                              y = re.2025$n))), nrow=1, ncol=7)
  
  #Convert R/E population counts to percentages of population
  re.2025.pct <- matrix(re.2025.n/sum(re.2025.n), nrow=7, ncol=1)
  
  #Process final projections for scenario
  
    #add variable indicating ppf_cat
    for (i in 1:length(p.f)) { 
      names(p.f[[i]])[2] <- paste(p.f[[i]][1,3])
    }
    
    #Generate merged dataframe with all offense categories' forecast projections
    p.f.m<-Reduce(MergeAll, lapply(p.f, function (x) x<-x[,1:2]))
    p.f.m$p<-rowSums(p.f.m[,-1], na.rm=TRUE) #sum up all categories in each year
    p.f.m$val <- lapply(p.f.m$year, function(x) paste("n", x, sep="_")) 
    p.f.m <- subset(p.f.m, select=c("val", "p"))
    p.f.m$val <- as.character(p.f.m$val)
  
  
  #Generate final forecast dataframe; combine R/E percentages and population
  
  forecast.df <- as.data.frame(cbind(c("re_w", "re_b", "re_h", 
                                       "re_n", "re_a", "re_hi", "re_o"), 
                                     re.2025.pct))
  names(forecast.df) <- c("val", "p")
  forecast.df$val<-as.character(forecast.df$val)
  forecast.df$p <- as.numeric(as.character(forecast.df$p))
  forecast.df <- rbind(forecast.df, p.f.m)
  
  #Merge o with baseline results
  forecast.df <- merge(forecast.df, GetBaselineLastYr(ST))
  
  forecast.df$b <- as.numeric(forecast.df$b)
  forecast.df$ly <- as.numeric(forecast.df$ly)
  
  
  return(forecast.df)
  
}
