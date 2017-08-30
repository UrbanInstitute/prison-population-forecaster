# PPF Model (2_model_v2.R)
# Purpose: produce PPF projections, graphs and other information on projections
# Created 3/14 by Lizzy Pelletier
# Last updated 8/8


## Set to WD that also contains counts.RData ##
# setwd("L:/RawData")



library(foreign)
#library(xlsx)
library(tidyr)
library(plyr)
library(ggplot2)
library(scales)



#############
## Define functions
#############

#Functions to produce projections

ExpandScenario <-function(scen.to.expand) {

# Expands scenarios with broad categories to include all subcategories
# Input: scen.to.expand is a policy impact scenario (list of lists in the form list(c("offensestring", pctreduction, reductiontype)))
# Returns: policy impact scenario (list of lists) including all subcategory scenarios
  
  ExpandOne <- function(one.scenario) {
    #print(one.scenario)
    #expands one individual scenario
    
    if ("violent" %in% one.scenario[[1]]){
      expanded <- list(c("assault", one.scenario[[2]], one.scenario[[3]]), c("homicide", one.scenario[[2]], one.scenario[[3]]), c("kidnapping", one.scenario[[2]], one.scenario[[3]]), 
                       c("otherviol", one.scenario[[2]], one.scenario[[3]]), c("robbery", one.scenario[[2]], one.scenario[[3]]), c("sexassault", one.scenario[[2]], one.scenario[[3]]))
    } else if ("drug" %in% one.scenario[[1]]) {
      expanded <- list(c("drugposs", one.scenario[[2]], one.scenario[[3]]), c("drugtraff", one.scenario[[2]], one.scenario[[3]]), c("otherdrug", one.scenario[[2]], one.scenario[[3]]))
      
    } else if ("property" %in% one.scenario[[1]]){
      expanded <- list(c("arson", one.scenario[[2]], one.scenario[[3]]), c("burglary", one.scenario[[2]], one.scenario[[3]]), c("fraud", one.scenario[[2]], one.scenario[[3]]),
                       c("larceny", one.scenario[[2]], one.scenario[[3]]), c("mvtheft", one.scenario[[2]], one.scenario[[3]]), c("otherprop", one.scenario[[2]], one.scenario[[3]]))
      
    } else if ("other" %in% one.scenario[[1]]){
      expanded <- list(c("dwi", one.scenario[[2]], one.scenario[[3]]), c("weapons", one.scenario[[2]], one.scenario[[3]]),
                       c("public_oth", one.scenario[[2]], one.scenario[[3]]))
      
    } else if ("nonviolent" %in% one.scenario[[1]]){
      expanded <- list(c("arson", one.scenario[[2]], one.scenario[[3]]), c("burglary", one.scenario[[2]], one.scenario[[3]]), c("drugposs", one.scenario[[2]], one.scenario[[3]]), 
                       c("drugtraff", one.scenario[[2]], one.scenario[[3]]), c("dwi", one.scenario[[2]], one.scenario[[3]]), c("fraud", one.scenario[[2]], one.scenario[[3]]), 
                       c("larceny", one.scenario[[2]], one.scenario[[3]]), c("mvtheft", one.scenario[[2]], one.scenario[[3]]), 
                       c("otherdrug", one.scenario[[2]], one.scenario[[3]]), c("otherprop", one.scenario[[2]], one.scenario[[3]]), c("public_oth", one.scenario[[2]], one.scenario[[3]]), 
                       c("weapons", one.scenario[[2]], one.scenario[[3]]))
    } else {
      expanded <- list(one.scenario)
    }
    # print(expanded)
    return(expanded)
  }
  
  #create list of expanded lists (one list for each original scenario from input scen.to.expand)
    expanded.list <- lapply(scen.to.expand, ExpandOne)  
  
  #unlist nested lists to produce list where each element is a scenario (rather than a list of scenarios)
    all.scenarios <- list()
    for (element in 1:length(expanded.list)){
      all.scenarios <- c(all.scenarios, expanded.list[[element]])
    }
  
  return(all.scenarios)
  
}


GetMultiplier<-function(category, scen.mult, type) {
  #Determines multiplier for a scenario to be applied to a specific category's baseline projection
  #Inputs:
    # category = category string
    # scen.mult = policy impact scenario
    # type ==1 if admissions; ==2 if length of stay
  #Returns: 
    # multiplier for length of stay or admissions number based on input offense category "category", scenario, and type (1 or 2)
    # Note: With percent change bounded between -1 and 1, multiplier will be between 0 and 2
  
  #CATEGORY IS INCLUDED IN ONE OR MORE POLICY CHANGE SCENARIOS
    if(category %in% unlist(scen.mult)){ 
      # print(scen.mult)
      relevant_scen<-scen.mult[sapply(scen.mult, function(x) category %in% x)] #capture any sub-scenarios that affect "category"
      #IF ONE RELEVANT SCENARIO (i.e. either admissions or LOS)
      if (length(relevant_scen)==1){ 
        
        if (relevant_scen[[1]][3]==type){  #if reduction type (adm vs LOS) in scenario matches function input type:
          multiplier<-1+as.numeric(relevant_scen[[1]][2]) #Assign 1 + pct chg to multiplier
          
        } else { 
          #reduction type does not match: multiplier = 1 (baseline - no change)
          multiplier <- 1

        }
      
      #IF TWO RELEVANT SCENARIOS (i.e. both admissions and LOS )
      } else if (length(relevant_scen)==2){ 
        
        if (relevant_scen[[1]][3]==type){ 
          #if reduction type in scenario 1 matches function "type" input, assign 1 + pct chg to multiplier
          multiplier<-1+as.numeric(relevant_scen[[1]][2]) 
          
        } else if (relevant_scen[[2]][3]==type){ 
          #if reduction type in scenario 2 matches function "type" input, assign 1 + pct chg to multiplier
          multiplier<-1+as.numeric(relevant_scen[[2]][2]) 
          
        } else { 
          #reduction type does not match: multiplier = 1 (baseline - no change)
          multiplier <- 1
        }
      }
      # print(multiplier)

  #CATEGORY IS NOT AFFECTED BY SCENARIO
    } else { 
      multiplier<-1 #baseline
    }
  return(as.numeric(multiplier))
    
}


merge.all <- function(x,y) {
  #merge together list of datasets
  merge(x, y, all=TRUE, by="year")
}


CatProjections <- function(category, counts.st, scen.cat, details) {
  
  #Given offense category & scenario, produce category-specific population projection
  #Inputs:
    #category = category string
    #counts.st = dataframe of counts for state
    #scen.cat = scenario
    #details = 0 to just return population projections; 1 to return all variables including admissions, LOS

  #Returns: Dataframe of projections for category
    #If details == 0, just returns year and N
    #If details == 1, also returns e, p, l


  #set relevant years
  lastyr<-max(counts.st$year)-1  #last year of real data
  firstyr<-min(counts.st$year)   #first year of real data
  firstyr_formean<-lastyr-4   #first year of data to be incorporated into projections
  
  #generate empty data frame from firstyr to 2025 as base for projections; merge to counts data
  proj_base<-as.data.frame(firstyr:2025)

  names(proj_base)<-"year"
  proj<-merge(proj_base, subset(counts.st, counts.st$ppf_cat==category), by="year", all.x=TRUE)

  #get scenario-dependent multiplier for e (admissions/entrances) and l (length of stay)
  e_multiplier<-GetMultiplier(category, scen.mult=scen.cat, type=1)
  l_multiplier<-GetMultiplier(category, scen.mult=scen.cat, type=2)

  #calculate 2025 values for admissions (e) & LOS (l)
  
    #admissions
      #e_vals = values necessary to make calculation (E (admissions) in recent years)  
        e_vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr_formean, select=c("year", "e"))         
      #calculate percent change for each interval in most recent 5 years
        e_pc_1 <- (e_vals$e[2] - e_vals$e[1])/e_vals$e[1] #oldest year
        e_pc_2 <- (e_vals$e[3] - e_vals$e[2])/e_vals$e[2]
        e_pc_3 <- (e_vals$e[4] - e_vals$e[3])/e_vals$e[3]
        e_pc_4 <- (e_vals$e[5] - e_vals$e[4])/e_vals$e[4] #most recent year
      #calculate weighted mean of percent changes (x4, then adjusted by tanh to bound between -1 and 1)
        e_pct_chg <- tanh(weighted.mean(c(e_pc_1, e_pc_2, e_pc_3, e_pc_4), c(1, 2, 2, 3))*4)
      #apply e_pct_chg to weighted mean of values in recent years; apply multiplier to simulate change from policy scenario
        e_final<- e_multiplier*(weighted.mean(as.vector(e_vals$e), c(1, 1, 2, 2, 3)) + (e_pct_chg*weighted.mean(as.vector(e_vals$e), c(1, 1, 2, 2, 3))))

    #LOS
      #l_vals = values necessary to make calcuation (L in recent years)
        l_vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr_formean, select=c("year", "l"))
      #calculate percent change for each interval in most recent 5 years
        l_pc_1 <- (l_vals$l[2] - l_vals$l[1])/l_vals$l[1] #oldest year
        l_pc_2 <- (l_vals$l[3] - l_vals$l[2])/l_vals$l[2]
        l_pc_3 <- (l_vals$l[4] - l_vals$l[3])/l_vals$l[3]
        l_pc_4 <- (l_vals$l[5] - l_vals$l[4])/l_vals$l[4] #most recent year
      #calculate weighted mean of percent changes (x4, then adjusted by tanh to bound between -1 and 1)
        l_pct_chg <- tanh(weighted.mean(c(l_pc_1, l_pc_2, l_pc_3, l_pc_4), c(1, 2, 2, 3))*4)
      #apply l_pct_chg to weighted mean of values in recent years; apply multiplier to simulate change from policy scenario
        l_final <- l_multiplier*(weighted.mean(as.vector(l_vals$l), c(1, 1, 2, 2, 3)) + (l_pct_chg*weighted.mean(as.vector(l_vals$l), c(1, 1, 2, 2, 3))))        
        
  # generate intervening years using linear step between last yr of real data and 2025 projection value
        
    #last year of real data
      e_lastval<-proj$e[proj$year==lastyr]  
      l_lastval<-proj$l[proj$year==lastyr]      

    #calculate step for equal interval between years 
      e_step<-(e_final-e_lastval)/(2025-lastyr) 
      l_step<-(l_final-l_lastval)/(2025-lastyr)
      
    #calculate intervening years using step between last real year and 2025 target value
      proj$e[proj$year>lastyr]<-seq(from=e_lastval+e_step, to=e_final, by=e_step) 
      proj$l[proj$year>lastyr]<-seq(from=l_lastval+l_step, to=l_final, by=l_step)
  
      
  # convert l to p (used to calculate N (stock population))
  # l = estimate for LOS based on proportion remaining in prison after one year
  # p = proportion remaining in prison after one year
  # L= 1/(1-p)
  # p = 1-(1/l)

    proj$p <- 1-(1/proj$l)

  #generate projected n's based on estimates for admissions and LOS
    
    #nt = stock pop in previous yr
    #p = proportion still in prison from prev yr stock
    #e = admissions over the year
    #n = admissions in current year (t+1 implied)
    # print(proj)
    # DW note: Edits will happen in this area from Lizzie
  
    proj$n<-(proj$nt*proj$p)+proj$e 
    # print(category)
    # print(lastyr - firstyr + 2)
    # print(proj)
    # print(2025-firstyr+1)
    for(i in (lastyr-firstyr+2):(2025-firstyr+1)){
      
      #n from year i-1 becomes nt for year i
      proj$nt[[i]]<-proj$n[[i-1]]
      
      #Convert projections for e and p to n (population)
      
      # (a) when p>=0 (corresponding to LOS >= 1 year):
        # n = (nt*p) + e
        if(proj$p[[i]]>=0){ 
          proj$n[[i]]<-(proj$nt[[i]]*proj$p[[i]])+proj$e[[i]]
          
      # (b) when p<0 (corresponding to LOS < 1 year):
        # n = e*l
        }else if(proj$p[[i]]<0) {
          proj$n[[i]]<-proj$e[[i]]*proj$l[[i]]
      }
    }
    # print(proj)
  #generate output dataframe conditional on details (# of vars required)
    if (details==0){
      final_projections<-subset(proj, select=c("year", "n"))
      names(final_projections)<-c("year", paste(category, "n", sep="_"))
      return(final_projections)
      
    } else{
      final_projections_d<-subset(proj, select=c("year", "e","l","p","n"))
      names(final_projections_d)<-c("year", paste(category, "e", sep="_"), paste(category, "l", sep="_"), paste(category, "p", sep="_"), paste(category, "n", sep="_"))
      return(final_projections_d)
    }
  
}

# main function

StateProjections <- function(ST, scenarios.list) { 
  #Produces projection outcome dataframe including:
      #baseline population, 
      #projected population, 
      #race/ethnicity breakdown at 3 points: 
          #(1) last actual year
          #(2) baseline 2025
          #(3) 2025 w/ projection scenario
      #last available year of data in each state (2012-2014 now, will be 2015)
  #Inputs:
    #ST = state two-letter string
    #scenarios.list = a scenario list
  
  STfile <- subset(counts.allstates, counts.allstates$state==ST)
  #print(STfile)
  # write.csv(co, file="costs.csv")
  
  state.categories<-unique(STfile$ppf_cat)
  
  # print(state.categories)
  
  all.scenarios <-ExpandScenario(scenarios.list) #expand scenarios if they include umbrella category (e.g., violent or nonviolent)
  
  # Last year of real data
  lastyr <- max(STfile$year)-1

  # Get scenario population projection counts in each category
    p.s<-lapply(state.categories, CatProjections, counts.st=STfile, 
                scen.cat=all.scenarios, details=0) 
  
  # print(p.s)
  
  #Calculate race/ethnicity percentages in 2025
    
      #add variable indicating ppf_cat to prepare for merge to race/ethnicity data  
        for (i in 1:length(p.s)){ 
            p.s[[i]]$ppf_cat <- paste(gsub("_n", "", names(p.s[[i]])[2]))
            names(p.s[[i]])[2] <- "n"
          }
      # print(p.s)

      # Combine 2025 population projections in each category; merge to R/E counts dataframe
        re.2025<- merge(Reduce(rbind, lapply(p.s, subset, year==2025)), 
                       subset(re, state==ST, by="ppf_cat"))
        # print(re.2025)

      #Multiply n in each category by R/E percentages; sum up N allocated to each R/E category
        re.2025.n <- matrix(colSums(as.data.frame(lapply(re.2025[, c("white", "black", "hispanic", "native", "asian", "hawaiian", "other")],
                       function(x, y) x * y,
                       y = re.2025$n))), nrow=1, ncol=7)
        # print(re.2025.n)

      #Convert R/E population counts to percentages of population
        re.2025.pct <- matrix(re.2025.n/sum(re.2025.n), nrow=7, ncol=1)

        # print(re.2025.pct)

  #Process final projections for scenario
        
      #add variable indicating ppf_cat
        for (i in 1:length(p.s)) { 
          names(p.s[[i]])[2] <- paste(p.s[[i]][1,3])
        }
      
      #Generate merged dataframe with all offense categories' population projections
        p.s.m<-Reduce(merge.all, lapply(p.s, function (x) x<-x[,1:2]))
        p.s.m$p<-rowSums(p.s.m[,-1], na.rm=TRUE) #sum up all categories in each year
        p.s.m$val <- lapply(p.s.m$year, function(x) paste("n", x, sep="_")) #generate "val" - measure name variable
        p.s.m <- subset(p.s.m, select=c("val", "p"))
        p.s.m$val <- as.character(p.s.m$val)
  
  #Generate final o (outcome) dataframe; combine R/E percentages and population
        
        o <- as.data.frame(cbind(c("re_w", "re_b", "re_h", "re_n", "re_a", "re_hi", "re_o"), re.2025.pct))
        names(o) <- c("val", "p")
        o$val<-as.character(o$val)
        o$p <- as.numeric(as.character(o$p))
        o <- rbind(o, p.s.m)

        # print(o)
  
  #Merge o with baseline results
        o <- merge(o, GetBaselineLastYr(ST))
        
        print(o)
# 

  #Produce cost estimate
  

        ann.pc <- co$pcexpend[co$stabbrev==ST] #annual per capita cost for state
        # print(ann.pc)
        yrlist <- (lastyr+1):2025 #set list of years over which to calculate cost savings
        
      #Savings in one year
        OneYrSavings <- function(year, o.df, reference) {
          #Inputs:
              #year: year in which to calculate cost savings
              #o.df: dataframe including population projections in baseline and with scenario applied
              #reference: which reference point to use ("b" for baseline; "ly" for last year of real data)
          #Output:
              #cost savings in one year
          
          if(reference=="b"){ #cost savings relative to baseline
            people <- o.df$p[o.df$val==paste("n", year, sep="_")] - o.df$b[o.df$val==paste("n", year, sep="_")] #number fewer people in prison
            pct <- (people / o.df$b[o.df$val==paste("n", year, sep="_")]) #percent change relative to baseline
            
          } else if(reference=="ly"){ #cost savings relative to last year of real data
            people <- o.df$p[o.df$val==paste("n", year, sep="_")] - o.df$b[o.df$val==paste("n", lastyr, sep="_")] #number fewer people in prison
            pct <- (people / o.df$b[o.df$val==paste("n", lastyr, sep="_")]) #percent change relative to last year of real data
          }
          print(pct)
          #if percent change is less than 12%, only marginal costs affected (use per capita figure * .12)
            if(abs(pct)<=.12){ 
              sav <- (ann.pc*(.12))*people
          #if percent change is greater than 12%, begin to cut into capital costs (use per capita figure * whatever percent reduction is)
            } else if(abs(pct)>.12){ 
              sav <- (ann.pc*(abs(pct)))*people
            }          
          return(sav)
        }
        
        #Cumulative savings in all years
          allyrs.b <- as.numeric(Reduce(sum, lapply(yrlist, OneYrSavings, o.df=o, reference="b"))) #relative to baseline
          allyrs.ly <- as.numeric(Reduce(sum, lapply(yrlist, OneYrSavings, o.df=o, reference="ly"))) #relative to last year of real data
          
        #Generate cost dataframe
          cost<-as.data.frame(matrix(cbind("cost", allyrs.b, allyrs.ly), nrow=1, ncol=3))
          names(cost) <- c("val", "b", "ly")
          cost$p <- NA
    
  #Merge o to cost estimates
      o<-rbind(o, cost)
      
  return(o)
 
}







#############
## Pre-populate baseline scenarios (still in progress)
#############



states <- unique(counts.allstates$state)

##NOTE:
## Still working on:
## - having StateProjections pull from pre-generated baseline dataframe for baseline comparison
## - having CatProjections pull from pre-generated baseline dataframe if cat is not affected by scenario

GetBaselineByCat <- function(ST) {
  STfile <- subset(counts.allstates, counts.allstates$state==ST)
  
  state.categories<-unique(STfile$ppf_cat)
  
  lastyr <- max(STfile$year)-1
  
  p.b <- lapply(state.categories, CatProjections, counts.st=STfile, 
                 scen.cat=list(c("x",0,0)), details=0) 

  for (i in 1:length(p.b)) { #add variable indicating ppf_cat
    p.b[[i]]$ppf_cat <- paste(gsub("_n", "", names(p.b[[i]])[2]))
    names(p.b[[i]])[2] <- "n"
  }
  p.b.merged <- do.call("rbind", p.b)  
  
  p.b.merged$state <- ST
}





GetBaselineLastYr <- function(ST) {
  STfile <- subset(counts.allstates, counts.allstates$state==ST)
  
  state.categories<-unique(STfile$ppf_cat)
  
  lastyr <- max(STfile$year)-1
  
  # Get baseline projection counts in each category
    p.b <- lapply(state.categories, CatProjections, counts.st=STfile, 
                  scen.cat=list(c("x",0,0)), details=0) 
  
  
  for (i in 1:length(p.b)) { #add variable indicating ppf_cat
    p.b[[i]]$ppf_cat <- paste(gsub("_n", "", names(p.b[[i]])[2]))
    names(p.b[[i]])[2] <- "n"
  }

  #Merge baseline counts to Race/Ethnicity percentages at two key points: 
    #(1) 2025
      re.2025<- merge(Reduce(rbind, lapply(p.b, subset, year==2025)), 
                     subset(re, state==ST, by="ppf_cat"))
    #(2) last year available in state
      re.ly  <- merge(Reduce(rbind, lapply(p.b, function (x) subset(x, x$year==lastyr))),  #combine last year of actual data; merge to race/ethnicity
                     subset(re, state==ST, by="ppf_cat"))
  
  #Multiply n in each category by R/E percentages; sum up N's allocated to each R/E category
        #this creates estimates of number of people in each R/E category in overall prison population
    re.2025.n <- matrix(colSums(as.data.frame(lapply(re.2025[, c("white", "black", "hispanic", "native", "asian", "hawaiian", "other")],
                                                 function(x, y) x * y,
                                                 y = re.2025$n))), nrow=7, ncol=1)
    re.ly.n <- matrix(colSums(as.data.frame(lapply(re.ly[, c("white", "black", "hispanic", "native", "asian", "hawaiian", "other")],
                                                  function(x, y) x * y,
                                                  y = re.ly$n))), nrow=7, ncol=1)
  #Calculate share of people in each category (estimated N for each R/E cat divided by total sum of N)
    re.2025.pct <- as.data.frame(re.2025.n/sum(re.2025.n))
    re.ly.pct <- as.data.frame(re.ly.n/sum(re.ly.n))
  

  #Process final projections for baseline
  for (i in 1:length(p.b)) { #add variable indicating ppf_cat
    names(p.b[[i]])[2] <- paste(p.b[[i]][1,3])
  }
    
  #Generate merged dataframe with all offense categories' population projections
    p.b.m<-Reduce(merge.all, lapply(p.b, function (x) x<-x[,1:2]))
    p.b.m$b<-rowSums(p.b.m[,-1], na.rm=TRUE) #summed baseline population estimate for all categories
    p.b.m$val <- lapply(p.b.m$year, function(x) paste("n", x, sep="_"))
    p.b.m <- subset(p.b.m, select=c("val", "b"))
    p.b.m$val <- as.character(p.b.m$val)
    p.b.m$ly<-NA
  
  #Generate final "outcome" dataframe; combine R/E percentages and population projections
  o <- cbind(c("re_w", "re_b", "re_h", "re_n", "re_a", "re_hi", "re_o"), re.2025.pct, re.ly.pct)
  names(o) <- c("val", "b", "ly")
  o$val <- as.character(o$val)
  o <- rbind(o, p.b.m)
  
  o$b <- as.numeric(o$b)
  o$ly <- as.numeric(o$ly)
  
  return(o)
  
}



##Run test scenarios


#Note: Scenario object must be a list of lists with 3 elements:
#(1) offense category string
  #INDIVIDUAL CATEGORY STRINGS CAN BE: 
      #arson, assault, burglary, drugposs, drugtraff, 
      #dwi, fraud, homicide, kidnapping, larceny, otherdrug, 
      #otherprop, otherviol, public_oth, robbery, sexassault, 
      #weapons, mvtheft
    #UMBRELLA CATEGORIES THAT WORK USING EXPAND SCENARIO FXN:
      #violent, nonviolent, drug, property, other
#(2) number between -1 and 1 indicating percent (.1 for 10% increase, -.5 for 50% decrease, -1 for 100% decrease, etc)
#(3) reduction type indicator; 1==admissions; 2==length of stay


load("costs.RData")
load("counts.RData")

test1 <- list(c("burglary", -.5, 2), c("drug", -.2, 1), c("drug", -.4, 2))
test2 <- list(c("other", -.1, 1))
test3 <- list(c("property",-.2,2),c("drug", -.2, 1), c("drug", -.4, 2))
test4 <- list(c("drug",.9,2),c("drug", .9, 1), c("violent", .9, 2),c("violent", .9, 1), c("other",.9,2),c("other", .9, 1),c("property",.9,2),c("property", .9, 1))
test5 <- list(c("drug",-.9,2),c("drug", -.9, 1), c("violent", -.9, 2),c("violent", -.9, 1), c("other",-.9,2),c("other", -.9, 1),c("property",-.9,2),c("property", -.9, 1))
test6 <- list(c("violent",-.28,2))
test7 <- list(c("property",-.49,5),c("violent",-.37,2))

StateProjections("CA", test1)
 # StateProjections("WA", test1)
