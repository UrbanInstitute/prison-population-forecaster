# PPF Model (2_model_v1.R)
# Purpose: produce PPF projections, graphs and other information on projections
# Created 3/14 by Lizzy Pelletier
# Last updated 7/28


## Set to WD that also contains counts.RData ##
#setwd()

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

#Expands scenarios with broad categories to include all subcategories
#Input: scen.to.expand is a reduction scenario
#Returns: scenario including list of all subcategory scenarios
  
  ExpandOne <- function(one.scenario) {
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
    return(expanded)
  }
  
  expanded.list <- lapply(scen.to.expand, ExpandOne)
  all.scenarios <- list()
  for (element in 1:length(expanded.list)){
    all.scenarios <- c(all.scenarios, expanded.list[[element]])
  }
  
  return(all.scenarios)
  
}


GetMultiplier<-function(category, scen.mult, type) {
  #Determines multiplier for a scenario to be applied to a specific category's baseline projection
  #Inputs:
    #category = category string
    #scen.mult = scenario to get multiplier for
    #type ==1 if admissions; ==2 if length of stay
  #Returns: multiplier for length of stay or admissions number based on offense category "category" and scenario list
  
  affected_cats<-sapply(scen.mult, '[[', 1)
  relevant_scen<-scen.mult[sapply(affected_cats, function(x) category %in% x)]
  
  if (length(relevant_scen)==1){ #If there is one relevant scenario
    
    if (relevant_scen[[1]][3]==type){
      multiplier<-1-as.numeric(relevant_scen[[1]][2])
      
    } else {
      multiplier <- 1
    }
  }
    
  else if (length(relevant_scen)==2){ #If there are two relevant scenarios (i.e., LOS and admissions)
    
    if (relevant_scen[[1]][3]==type){
      multiplier<-1-as.numeric(relevant_scen[[1]][2])
      
    } else if (relevant_scen[[2]][3]==type){
      multiplier<-1-as.numeric(relevant_scen[[2]][2])
    
    } else {
      multiplier <- 1
    }
    
  }

  else { #If there are no relevant scenarios
    multiplier<-1
  }
    
  return(as.numeric(multiplier))
    
}


merge.all <- function(x,y) {
  #merge together list of datasets
  merge(x, y, all=TRUE, by="year")
}


CatProjections <- function(category, cat.df, scen.cat, forlittleplot) {
  
  #Produce category-specific projection given category & scenario
  #Inputs:
    #category = category string
    #cat.df = dataframe of counts for state
    #scen.cat = scenario
    #forlittleplot = 1 if using to produce littleplot diagnostics; 0 if not
  #Returns: Dataframe of projections for category

  
  #set mean weights
  mean_weights<-c(1, 1, 2, 2, 3)
  
  #set year boundaries
  lastyr<-max(cat.df$year)-1
  firstyr<-min(cat.df$year)
  firstyr_formean<-lastyr-4
  
  #generate data frame as base for projections; merge to actual data
  proj_base<-as.data.frame(firstyr:2025)
  names(proj_base)<-"year"
  proj<-merge(proj_base, subset(cat.df, cat.df$ppf_cat==category), by="year", all.x=TRUE)
  
  #get scenario-dependent multiplier
  e_multiplier<-GetMultiplier(category, scen.mult=scen.cat, type=1)
  l_multiplier<-GetMultiplier(category, scen.mult=scen.cat, type=2)
  
  #get weighted mean - final value for admissions and LOS
  
  e_vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr_formean, select=c("year", "e"))
  e_lm<-lm(e_vals$e ~ e_vals$year)
  e_pc_1 <- (e_vals$e[5] - e_vals$e[4])/e_vals$e[4]
  e_pc_2 <- (e_vals$e[4] - e_vals$e[3])/e_vals$e[3]
  e_pc_3 <- (e_vals$e[3] - e_vals$e[2])/e_vals$e[2]
  e_pc_4 <- (e_vals$e[2] - e_vals$e[1])/e_vals$e[1]
  e_pct_chg <- tanh(weighted.mean(c(e_pc_1, e_pc_2, e_pc_3, e_pc_4), c(1, 2, 2, 3))*4)
  e_target<-weighted.mean(as.vector(e_vals$e), mean_weights) + (e_pct_chg*weighted.mean(as.vector(e_vals$e), mean_weights))
  e_final<-e_target*e_multiplier
  
  
  l_vals<-subset(proj, proj$year<=lastyr & proj$year>=firstyr_formean, select=c("year", "l"))
  l_lm<-lm(l_vals$l~l_vals$year)
  l_pc_1 <- (l_vals$l[5] - l_vals$l[4])/l_vals$l[4]
  l_pc_2 <- (l_vals$l[4] - l_vals$l[3])/l_vals$l[3]
  l_pc_3 <- (l_vals$l[3] - l_vals$l[2])/l_vals$l[2]
  l_pc_4 <- (l_vals$l[2] - l_vals$l[1])/l_vals$l[1]
  l_pct_chg <- tanh(weighted.mean(c(l_pc_1, l_pc_2, l_pc_3, l_pc_4), c(1, 2, 2, 3))*4)
  l_target<-weighted.mean(as.vector(l_vals$l), mean_weights) + (l_pct_chg*weighted.mean(as.vector(l_vals$l), mean_weights))
  l_final<-l_target*l_multiplier
  
  #generate burn-in data
  
  e_lastval<-proj$e[proj$year==lastyr]
  step<-(e_final-e_lastval)/(2025-lastyr)
  proj$e[proj$year>lastyr]<-seq(from=e_lastval+step, to=e_final, by=step)
  
  l_lastval<-proj$l[proj$year==lastyr]
  step<-(l_final-l_lastval)/(2025-lastyr)
  proj$l[proj$year>lastyr]<-seq(from=l_lastval+step, to=l_final, by=step)
  
  
  proj$p<-1-(1/proj$l)

  
  #generate projected n's
  proj$n<-(proj$nt*proj$p)+proj$e 
  for(i in (lastyr-firstyr+2):(2025-firstyr+1)){
    proj$nt[[i]]<-proj$n[[i-1]]
    if(proj$p[[i]]>=0){
      proj$n[[i]]<-(proj$nt[[i]]*proj$p[[i]])+proj$e[[i]]
    }else if(proj$p[[i]]<0) {
      proj$n[[i]]<-proj$e[[i]]*proj$l[[i]]
    }
  }
  
  #paste is a string concatenator
  
  if (forlittleplot==0){
    final_projections<-subset(proj, select=c("year", "n"))
    names(final_projections)<-c("year", paste(category, "n", sep="_"))
    return(final_projections)
  } else{
    final_projections_lp<-subset(proj, select=c("year", "e","l","p","n"))
    names(final_projections_lp)<-c("year", paste(category, "e", sep="_"), paste(category, "l", sep="_"), paste(category, "p", sep="_"), paste(category, "n", sep="_"))
    return(final_projections_lp)
  }
  
}


#main function
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
  
  # counts.allstates is a variable name, (normally an underscore in most languages)
  # $ accesses column name
  
  STfile <- subset(counts.allstates, counts.allstates$state==ST)
  
  state.categories<-unique(STfile$ppf_cat)
  
  # see above function
  all.scenarios <-ExpandScenario(scenarios.list) #expand scenarios if they include umbrella category (e.g., violent or nonviolent)
  
  # Find the last year
  lastyr <- max(STfile$year)-1
  
# passing in a list
  #generate baseline projections
    p.b <- lapply(state.categories, CatProjections, cat.df=STfile, 
                  scen.cat=list(c("x",0,0)), forlittleplot=0) 
  #generate scenario projections
    p.s<-lapply(state.categories, CatProjections, cat.df=STfile, 
                scen.cat=all.scenarios, forlittleplot=0) 
  
  for (i in 1:length(p.b)) { #add variable indicating ppf_cat
    p.b[[i]]$ppf_cat <- paste(gsub("_n", "", names(p.b[[i]])[2]))
    names(p.b[[i]])[2] <- "n"
  }
  for (i in 1:length(p.s)){ #add variable indicating ppf_cat
    p.s[[i]]$ppf_cat <- paste(gsub("_n", "", names(p.s[[i]])[2]))
    names(p.s[[i]])[2] <- "n"
  }
  # figure out double brackets...maybe row? 
  # figure out what a data frame is
    
  #rbind, right side merge compare p.b (before) and p.b.25 (after)
    
  p.b.25<- merge(Reduce(rbind, lapply(p.b, subset, year==2025)), #combine b. projections for 2025; merge to race/ethnicity data
                 subset(re, state==ST, by="ppf_cat"))
  p.s.25<- merge(Reduce(rbind, lapply(p.s, subset, year==2025)), #combine s. projections for 2025; merge to race/ethnicity data
                 subset(re, state==ST, by="ppf_cat"))
  p.ly  <- merge(Reduce(rbind, lapply(p.s, function (x) subset(x, x$year==lastyr))),  #combine last year of actual data; merge to race/ethnicity
               subset(re, state==ST, by="ppf_cat"))
  
  nb.re <- matrix(colSums(as.data.frame(lapply(p.b.25[, c("white", "black", "hispanic", "native", "asian", "hawaiian", "other")],
                 function(x, y) x * y,
                 y = p.b.25$n))), nrow=1, ncol=7)
  ns.re <- matrix(colSums(as.data.frame(lapply(p.s.25[, c("white", "black", "hispanic", "native", "asian", "hawaiian", "other")],
                 function(x, y) x * y,
                 y = p.s.25$n))), nrow=1, ncol=7)
  nly.re <- matrix(colSums(as.data.frame(lapply(p.ly[, c("white", "black", "hispanic", "native", "asian", "hawaiian", "other")],
                 function(x, y) x * y,
                 y = p.ly$n))), nrow=1, ncol=7)
  
  #Create output dataframe; add R/E breakdowns
  o <- as.data.frame(c(nb.re/sum(nb.re), ns.re/sum(ns.re), nly.re/sum(nly.re)))
  names(o) <- c("val")
  o$desc <- c("b25_w", "b25_b", "b25_hs", "b25_n", "b25_a", "b25_hi", "b25_o", #Baseline 2025 R/E breakdown
              "sc25_w", "sc25_b", "sc25_hs", "sc25_n", "sc25_a", "sc25_hi", "sc25_o", #Scenario 2025 R/E breakdown
              "ly_w", "ly_b", "ly_hs", "ly_n", "ly_a", "ly_hi", "ly_o") #Last available year R/E breakdown
  
  #Process final projections for baseline
  for (i in 1:length(p.b)) { #add variable indicating ppf_cat
    names(p.b[[i]])[2] <- paste(p.b[[i]][1,3])
  }
  p.b.m<-Reduce(merge.all, lapply(p.b, function (x) x<-x[,1:2]))
  p.b.m$n<-rowSums(p.b.m[,-1], na.rm=TRUE)
  p.b.m <- subset(p.b.m, select=c("year", "n"))
  p.b.m$year <- lapply(p.b.m$year, function(x) paste("basel", x, sep="_"))
  names(p.b.m) <- c("desc", "val")

  #Process final projections for scenarios
  for (i in 1:length(p.s)) { #add variable indicating ppf_cat
    names(p.s[[i]])[2] <- paste(p.s[[i]][1,3])
  }
  p.s.m<-Reduce(merge.all, lapply(p.s, function (x) x<-x[,1:2]))
  p.s.m$n<-rowSums(p.s.m[,-1], na.rm=TRUE)
  p.s.m <- subset(p.s.m, select=c("year", "n"))
  p.s.m$year <- lapply(p.s.m$year, function(x) paste("scen", x, sep="_"))
  names(p.s.m) <- c("desc", "val")
  
  o<-as.data.frame(rbind(o, p.b.m, p.s.m))
  o<-as.data.frame(rbind(o, c(lastyr, "lastyr")))
  o$val<-as.numeric(o$val)
  return(o)
 
}


OffenseCatSummary <- function(stabbrev) {
  #produce summary of offense category breakdown in a state in most recent year
  #(irrelevant for web feature)
  #Inputs: stabbrev == two-letter state string
  #Returns: dataframe of admissions and population breakdowns for each category in recent year
  
  sd <- subset(counts.allstates, state==stabbrev)
  sd_e <- subset(sd, sd$year==as.numeric(max(sd$year)-1), select=c("ppf_cat", "e"))
  sd_e$pct <- (sd_e$e/sum(sd_e$e))
  names(sd_e) <- c("ppf_cat", "Admissions", "Admissions_Pct")
  sd_n <- subset(sd, sd$year==as.numeric(max(sd$year)), select=c("ppf_cat", "nt"))
  sd_n$pct <- (sd_n$n/sum(sd_n$n))
  names(sd_n) <- c("ppf_cat", "Population", "Population_Pct")
  catsum <- merge(sd_e, sd_n, by="ppf_cat")
  return(catsum)
}





#############
## Load in counts (produced by 1_ncrpprocessing.R) and run a sample scenario
#############


load("counts.Rdata")

#Note: Scenario object must be a list of lists with 3 elements:
#(1) offense category string
  #INDIVIDUAL CATEGORY STRINGS CAN BE: 
      #arson, assault, burglary, drugposs, drugtraff, 
      #dwi, fraud, homicide, kidnapping, larceny, otherdrug, 
      #otherprop, otherviol, public_oth, robbery, sexassault, 
      #weapons, mvtheft
    #UMBRELLA CATEGORIES THAT WORK USING EXPAND SCENARIO FXN:
      #violent, nonviolent, drug, property, other
#(2) number between 0 and 1 indicating reduction (.1 for 10%; 1 for 100%, etc)
#(3) reduction type indicator; 1==admissions; 2==length of stay



test1 <- list(c("burglary", .5, 2), c("drug", .2, 1))
test2 <- list(c("other", .0, 1))

# diff scenarios
# StateProjections("AZ", test2)
# StateProjections("WA", test1)
StateProjections("PA", list(c("larceny", .2, 2), c("drug", 1, 1)))




