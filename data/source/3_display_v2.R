# PPF Display functions (3_display_v2.R)
# Purpose: produce graphs and tables for display
# Created 6/15 by Lizzy Pelletier
# Last updated 7/27

##setwd to file location that contains 2_model_v1, counts.Rdata, costs.Rdata
#setwd()

source("2_model_v1.R")
load("counts.Rdata")
load("costs.Rdata")

# Col 1: Name of offense category
# Col 2: 
    # "Institute alternatives that reduce admissions for -*- by -*- (-*- people)"
    # "Reduce time served for -*- by -*- (from -*- to -*- years)
# Col 3: 
    # "-*- fewer people (-*- % reduction)

Col1 <- function(onescenario){
  cat.names <- read.csv("L:/RawData/ppf_cat_names.csv")
  name <- cat.names[cat.names$ppf_cat==paste(onescenario[[1]][1]), c("ppf_cat_name")]
  return(as.character(name))
}

Col2<- function(onescenario, StateName, lgth) {
  
  #Input: individual scenario: either (1) admissions or LOS reduction OR (2) admissions and LOS reduction for same offense
  descriptions <- c()
  for (i in 1:length(onescenario)) {
    s<-onescenario[[i]]
    percentage <- paste(as.numeric(s[2])*100, "%", sep="")
    
    
    catex_p <- CatProjections(paste(s[1]), subset(counts.allstates, counts.allstates$state==StateName), ExpandScenario(onescenario), forlittleplot=1)
    names(catex_p) <- c("y", "e", "l", "p", "n")
    catex_b <- CatProjections(paste(s[1]), subset(counts.allstates, counts.allstates$state==StateName), list(c("x",0,0)), forlittleplot=1)
    names(catex_b) <- c("y", "e", "l", "p", "n")
    
    fromlos <- catex_b$l[catex_b$y==2025]
    tolos <- catex_p$l[catex_p$y==2025]
    admdiff = catex_p$e[catex_p$y==2025] - catex_b$e[catex_b$y==2025]
    
    if(s[3]==1){
      desc <- paste("Institute alternatives that reduce admissions by ", percentage, " (", format(round(abs(admdiff), 0), big.mark=","), " fewer people admitted)", sep="")
      desc.short <- paste("Reduce admissions by ", percentage, " (", format(round(abs(admdiff), 0), big.mark=","), " fewer people)", sep="")
    } else if (s[3]==2){
      desc <- paste("Reduce average time served by ", percentage, " (from ", sprintf("%.2f", fromlos), " to ", sprintf("%.2f", tolos), " years)",sep="")
      desc.short <- paste("Reduce LOS by ", percentage, " (", sprintf("%.2f", fromlos), " to ", sprintf("%.2f", tolos)," years)", sep="")
    }
    if(lgth=="short") {
      descriptions <- c(descriptions, desc.short)
    } else if (lgth=="long"){
      descriptions <- c(descriptions, desc)
    }
  }
  
  return(descriptions)
}

Col3Pop <- function(odf, lgth) {
  chg_people <-  odf[odf$desc=="scen_2025",c("val")] - odf[odf$desc=="basel_2025",c("val")]
  chg_pct <- (chg_people / odf[odf$desc=="basel_2025",c("val")])*100
  if(chg_people<0) {
    desc <- paste(format(round(abs(chg_people), 0), big.mark=","), " fewer people (", sprintf("%.2f", abs(chg_pct)), "% reduction)", sep="")
    desc.short <- paste(round(abs(chg_people), 0), " (", round(abs(chg_pct), 2), "% reduction)", sep="")
  } else{
    desc <- paste(format(round(abs(chg_people), 0), big.mark=","), " more people (", sprintf("%.2f", abs(chg_pct)), "% increase)", sep="")
    desc.short <- paste(round(abs(chg_people), 0), " (", round(abs(chg_pct), 2), "% increase)", sep="")
  }
  if(lgth=="short") {
    return(desc.short)
  } else if (lgth=="long"){
    return(desc)
  }
}



Col5Race <- function(odf) {
  odf<-odf[grep("25_", odf$desc),]
  odf$c<-"Baseline"
  odf$c[grepl("sc25_", odf$desc)] <- "Projected Impact" 
  odf$re <- "White"
  odf$re[grepl("_b", odf$desc)] <- "Black"
  odf$re[grepl("_hs", odf$desc)] <- "Hispanic/Latino"
  odf$re[grepl("_n", odf$desc)] <- "Native American"
  odf$re[grepl("_a", odf$desc)] <- "Asian"
  odf$re[grepl("_hi", odf$desc)] <- "Hawaiian/Pacific Islander"
  odf$re[grepl("_o", odf$desc)] <- "Other"
  odf$re<-ordered(odf$re, levels=c("White", "Black", "Hispanic/Latino", "Native American", "Asian", "Hawaiian/Pacific Islander", "Other"))
  cats <- unique(odf$re)
  odf$drop<-0
  for (cat in cats) {
    if(min(odf$val[odf$re==cat])==0){
      odf$drop[odf$re==cat] <-1
    }
  }
  odf<-subset(odf, odf$drop==0)
  cats<-as.list(levels(odf$re)[levels(odf$re) %in% unique(odf$re)])
  GetChg <- function(cat){
    frompct <- (odf$val[odf$c=="Baseline" & odf$re==cat])*100
    topct <- (odf$val[odf$c=="Projected Impact" & odf$re==cat])*100
    if(abs(frompct-topct)>=0.1){
      chg <- paste(sprintf("%.1f", frompct), "% -> ", sprintf("%.1f", topct), "%", sep="")
    } else if (abs(frompct-topct)<0.1){
      chg <- "No change"
    }
    return(chg)
  }
  changes <- lapply(cats, GetChg)
  changes <- as.data.frame(t(rbind(cats, changes)))
  changes$chg <- paste(changes$cats, changes$changes, sep=": ")
  return(paste(changes$chg, collapse="; "))
}

Rank <- function(odf) {
  chg_people <-  odf[odf$desc=="scen_2025",c("val")] - odf[odf$desc=="basel_2025",c("val")]
  chg_pct <- (chg_people / odf[odf$desc=="basel_2025",c("val")])*100
  return(as.numeric(chg_pct))
}


GenRow <- function(ST, sc, lgth="long") {
  rs <-matrix(nrow=0, ncol=6)
    for(i in 1:length(sc)){
      r <- matrix(c(Col1(sc), Col2(sc, ST, lgth)[i], 
                    Col3Pop(StateProjections(ST, sc), lgth), 
                    CostSavings(StateProjections(ST, sc), ST=ST),
                    Col5Race(StateProjections(ST, sc)),
                    Rank(StateProjections(ST, sc))), nrow=1, ncol=6)
      rs <- rbind(rs, r)
    }
  return(rs)
}



Chg_People <- function(odf) {
  chg_people <-  odf[odf$desc=="scen_2025",c("val")] - odf[odf$desc=="basel_2025",c("val")]
  chg_people <- format(as.numeric(chg_people), scientific=FALSE)
  return(chg_people)
}

Chg_Pct <- function(odf) {
  chg_people <-  odf[odf$desc=="scen_2025",c("val")] - odf[odf$desc=="basel_2025",c("val")]
  chg_pct <- (chg_people / odf[odf$desc=="basel_2025",c("val")])*100
  return(chg_pct)
}

CostSavings <- function(odf, ST){
  ann.pc <- co$pcexpend[co$stabbrev==ST]
  yrlist <- (odf$val[odf$desc=="lastyr"]+1):2025
  OneYrSavings <- function(year, odf) {
    people <- odf$val[odf$desc==paste("scen", year, sep="_")] - odf$val[odf$desc==paste("basel", year, sep="_")]
    pct <- abs((people / odf$val[odf$desc==paste("basel", year, sep="_")])*100)
    if(pct<=12){
      sav <- (ann.pc*.12)*people
    } else if(pct>12){
      sav <- (ann.pc*(pct/100))*people
    }
  }
  allyrs <- abs(Reduce(sum, lapply(yrlist, OneYrSavings, odf=odf)))
  return(paste("$",format(allyrs, big.mark=","),sep=""))
}


PlotRace <- function(odf) {
  odf<-odf[grep("25_", odf$desc),]
  odf$c<-"Baseline"
  odf$c[grepl("sc25_", odf$desc)] <- "Projected Impact" 
  odf$re <- "White"
  odf$re[grepl("_b", odf$desc)] <- "Black"
  odf$re[grepl("_hs", odf$desc)] <- "Hispanic/Latino"
  odf$re[grepl("_n", odf$desc)] <- "Native American"
  odf$re[grepl("_a", odf$desc)] <- "Asian"
  odf$re[grepl("_hi", odf$desc)] <- "Hawaiian/Pacific Islander"
  odf$re[grepl("_o", odf$desc)] <- "Other"
  odf$re<-ordered(odf$re, levels=c("White", "Black", "Hispanic/Latino", "Native American", "Asian", "Hawaiian/Pacific Islander", "Other"))
  cats <- unique(odf$re)
  odf$drop<-0
  for (cat in cats) {
    if(min(odf$val[odf$re==cat])==0){
      odf$drop[odf$re==cat] <-1
    }
  }
  graph <- ggplot(data=subset(odf, odf$drop==0), aes(x = re, fill = c, y=val)) + geom_bar(stat="identity", position="dodge") +
    #theme(axis.text.x=element_text(angle=90))  +
     geom_text(aes(label=paste(sprintf("%.1f",val*100), "%", sep="")), vjust=-.5, color="black",
               position = position_dodge(0.9), size=3.5) + scale_y_continuous(labels=percent_format(), limits=c(0, as.numeric(max(odf$val)+.05))) +
     ylab("Percent of prison population") +xlab("") + scale_fill_discrete(name="") 
  return(graph)
  
}

ReportHispanic <- function(ST){
  if(mean(re$hisp_f[re$state==ST]==1)){
    result <- 1
  } else if(mean(re$hisp_f[re$state==ST]==0)){
    result <- 0
  }
  return(result)
}


LongDescription <- function(scens, StateName){
  cats.for.state<-unique(subset(counts.allstates, counts.allstates$state==StateName)$ppf_cat)
  scen.cats.for.state <- sapply(ExpandScenario(scens), '[[', 1)
  scens.filtered <- ExpandScenario(scens)[scen.cats.for.state %in% cats.for.state]
  list_of_changes <- lapply(scens.filtered, ConverttoDescription, allscenarios=ExpandScenario(scens), StateName=StateName)
  return(list_of_changes)
}

OutcomesofBundles <- function(scen, StateName) {
  result <- ScenarioOutcome("AZ", scen, scen[[1]][1])
  people <- round(as.numeric(result$RawChg_Baseline), 0)
  pct <- round(as.numeric(result$PctChg_Baseline), 1)
  text <- paste(people, " fewer people (", pct, "% reduction)", sep="")
  return(text)
}


#Functions to display data and return projection outcomes

PlotProjections<-function(ST, scenario1, s1desc, scenario2, s2desc, scenario3, s3desc) {
  #plots projections in a state for up to 3 scenarios
  #Inputs:
  #ST - State two-letter string
  #scenario1, scenario2, scenario3 = lists of scenarios
  #s1desc, s2desc, s3desc = strings describing scenarios to show up on graph
  #Returns: ggplot graph object
  
  STfile <- subset(counts.allstates, counts.allstates$state==ST)
  last.real.year <- as.numeric(max(counts.allstates$year))-1
  
  
  s1<-StateProjections(ST, scenarios.list=scenario1)
  s1$c<-"Actual"
  s1$c[s1$year>last.real.year]<-paste(s1desc)
  s2<-StateProjections(ST, scenarios.list=scenario2)
  s2$c<-"Actual"
  s2$c[s2$year>last.real.year]<-paste(s2desc)
  s3<-StateProjections(ST, scenarios.list=scenario3)
  s3$c<-"Actual"
  s3$c[s3$year>last.real.year]<-paste(s3desc)
  
  graph<-ggplot()+geom_point(data=s1, aes(x=year, y=n, colour=c)) +
    geom_point(data=subset(s2), aes(x=year, y=n, colour=c)) + 
    geom_point(data=subset(s3), aes(x=year, y=n, colour=c)) + 
    xlim(2000,2025)  + ylim(0, max(max(s1$n), max(s2$n), max(s3$n))) + labs(x="Year", y="Population", title="", colour="")
  return(graph)
  
}




little_plots<-function(cat, ST, scenarios, scenario_name){
  #produce separate plots of p, l, n, and e for specific category and scenario
  #Inputs:
  #cat = category string
  #ST = state two-letter string
  #scenarios = scenario list
  #scenario_name = string description of scenario 
  #Returns: ggplot object of little plots for diagnostics
  
  STfile <- subset(counts.allstates, counts.allstates$state==ST)
  
  all.scenarios <- ExpandScenario(scenarios)
  
  cat_df<-CatProjections(cat, STfile, scen.cat=all.scenarios, forlittleplot=1)
  cat_df_baseline<-CatProjections(cat, STfile, scen.cat=baseline, forlittleplot=1)
  
  if (!is.null(cat_df)) {
    cat_df$c<-"actual"
    cat_df$c[cat_df$year>2014]<-paste(scenario_name)
    cat_name<-stri_sub(names(cat_df[2]), 1, -3)
    
    #little plot of e
    e<-ggplot()+     
      geom_point(aes(x=cat_df_baseline$year, y=cat_df_baseline[,2])) +              
      geom_point(aes(x=cat_df$year, y=cat_df[,2], colour=cat_df$c))+ 
      labs(x="Year", y="Admissions", title=paste(cat_name, "Admissions", sep=" ")) + theme(legend.position="none")
    
    #little plot of l
    l<-ggplot()+     
      geom_point(aes(x=cat_df_baseline$year, y=cat_df_baseline[,3])) +             
      geom_point(aes(x=cat_df$year, y=cat_df[,3], colour=cat_df$c))+
      labs(x="Year", y="L", title=paste(cat_name, "L", sep=" "))+ theme(legend.position="none")
    
    #little plot of p
    p<-ggplot()+     
      geom_point(aes(x=cat_df_baseline$year, y=cat_df_baseline[,4])) +             
      geom_point(aes(x=cat_df$year, y=cat_df[,4], colour=cat_df$c))+ 
      labs(x="Year", y="P", title=paste(cat_name, "P", sep=" "))+ theme(legend.position="none")
    
    #little plot of n
    n<-ggplot()+  
      geom_point(aes(x=cat_df_baseline$year, y=cat_df_baseline[,5]))+            
      geom_point(aes(x=cat_df$year, y=cat_df[,5], colour=cat_df$c))+ 
      labs(x="Year", y="Population", title=paste(cat_name, "Population", sep=" "))+ theme(legend.position="none")
    
    plots<-list(n,e,l,p)
    #return(plot_grid(plotlist=plots, nrow=1, ncol=4))
    return(list(cat_df, cat_df_baseline))
  }
  else {
    return(NULL)
  }
}

