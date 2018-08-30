# FILE: 
#    display_model_output.R
# PURPOSE: 
#    Define fxns that produce table of PPF output



# Create table of results from PPF model
  

    GetCol1 <- function(onescenario){
      # Column 1: Offense category affected by scenario
      # Argument: A single forecast scenario
      # Returns: Full name of relevant offense category
      s <- unlist(onescenario)
      name <- cat.names[cat.names$ppf_cat==paste(s[1]), 
                        c("ppf_cat_name")]
      return(as.character(name))
    }
  
    
    GetCol2 <- function(onescenario) {
      # Column 2: Describe changes encompassed in scenario
      # Arguments: 
      #   onescenario: individual forecast scenario
      # Returns:
      #   Description of forecast scenario change
      
      s <- unlist(onescenario)

      # Calculate percent change
      percentage <- paste(abs(as.numeric(s[2]))*100, "%", sep="")

      # Produce description based on parameters
        if(s[3]==1){
          if(s[2]<0){
            desc <- paste(GetCol1(onescenario), ": Reduce annual admissions by ", percentage, 
                          sep="")
          } else if(s[2]>0){
            desc <- paste(GetCol1(onescenario), ": Increase annual admissions by ", percentage, 
                          sep="")
          }
          
        } else if (s[3]==2){
          if(s[2]<0){
            desc <- paste(GetCol1(onescenario), ": Reduce length of prison term by ", percentage, 
                          sep="")
          } else if(s[2]>0) {
            desc <- paste(GetCol1(onescenario), ": Increase length of prison term by ", percentage, 
                          sep="")
          }
        }
      
      return(desc)
    }
    
    GetCol3 <- function(fdf) {
      # Column 3: describe change in prison population relative to baseline
      # Argument: 
      #   fdf = forecast dataframe - returned by StateProjections function
      # Returns: 
      #   String description of population change relative to 2025 baseline
      
      chg.people <-  fdf[fdf$val=="n_2025",c("p")] - 
                          fdf[fdf$val=="n_2025",c("b")]
      chg.pct <- (chg.people / fdf[fdf$val=="n_2025",c("b")])*100
      if(chg.people<0) {
        desc <- paste(sprintf("%.2f", abs(chg.pct)), "% reduction (", 
                      format(round(abs(chg.people), 0), big.mark=","), 
                      " fewer people)", sep="")
      } else{
        desc <- paste(sprintf("%.2f", abs(chg.pct)), "% increase (", 
                      format(round(abs(chg.people), 0), big.mark=","), 
                      " more people)",  sep="")
      }
        return(desc)
    }
  
  
  
    GetCol4 <- function(fdf) {
      # Column 4: describe change in racial/ethnic makeup of prison population 
      # relative to baseline
      # Argument: 
      #   fdf = forecast dataframe - returned by StateProjections function
      # Returns: 
      #   String description of racial/ethnic makeup change
      
      # Flag for whether 2025 population is (essentially) zero
      popzero <- fdf$p[fdf$val=="n_2025"]<0.01

      
      fdf<-fdf[grep("re_", fdf$val),]
      fdf$re <- "White"
      fdf$re[grepl("_b", fdf$val)] <- "Black"
      fdf$re[grepl("_h$", fdf$val)] <- "Hispanic/Latino"
      fdf$re[grepl("_n", fdf$val)] <- "Native American"
      fdf$re[grepl("_a", fdf$val)] <- "Asian"
      fdf$re[grepl("_hi", fdf$val)] <- "Hawaiian/Pacific Islander"
      fdf$re[grepl("_o", fdf$val)] <- "Other"
      fdf$re<-ordered(fdf$re, levels=c("White", "Black", "Hispanic/Latino", 
                                       "Native American", "Asian", 
                                       "Hawaiian/Pacific Islander", "Other"))
      
      cats <- unique(fdf$re)
      fdf$drop<-0
      
      for (cat in cats) {
        if(fdf$b[fdf$re==cat]==0 ){
          fdf$drop[fdf$re==cat] <-1
        }
      }
      
      fdf<-subset(fdf, fdf$drop==0)
      cats<-as.list(levels(fdf$re)[levels(fdf$re) %in% unique(fdf$re)])
      
      GetChg <- function(cat){
        from <- as.numeric(sprintf("%.2f\n", fdf$b[fdf$re==cat]*100))
        if(popzero==FALSE) {
          to <- as.numeric(sprintf("%.2f\n", fdf$p[fdf$re==cat]*100))
          chgval <- (to-from)
          if(abs(chgval)>=.01){
            chg <- paste(sprintf("%.2f",from),
                         "% to ", sprintf("%.2f",to),
                         "%", sep="")
          } else if (abs(chgval)<.01){
            chg <- "No change"
          }
        } else if(popzero==TRUE){
          chg <- paste(sprintf("%.2f", from), "% to N/A", sep="")
        }
        return(chg)
      }
      
      changes <- lapply(cats, GetChg)
      changes <- as.data.frame(t(rbind(cats, changes)))
      changes$chg <- paste(changes$cats, changes$changes, sep=": ")
      return(paste(paste(changes$chg, collapse="; "), 
                   " [Note: Forecast population is 0 in 2025, so there are no percentages to compare to the baseline value]",
                   sep=""))
    }
  
    GetCol5 <- function(fdf, ST){
      # Column 5: describe change in state correctional spending (savings/
      # increase) relative to baseline
      # Argument: 
      #   fdf = forecast dataframe - returned by StateProjections function
      # Returns: 
      #   String description of cost change 
      
      #annual per capita institutional corrections cost in state:
      ann.pc <- co$pcexpend[co$stabbrev==ST] 
      
      yrs<-strsplit(fdf$val[fdf$p==fdf$b & grepl("n_", fdf$val)],  
                    split='_', fixed=TRUE)
      lastyr<-as.numeric(yrs[[length(yrs)]][2])
      yrlist <- (lastyr+1):2025
      OneYrSavings <- function(year, fdf) {
        chg_people <-  fdf[fdf$val==paste("n_",year, sep=""),c("p")] - 
                          fdf[fdf$val==paste("n_",year, sep=""),c("b")]
        chg_pct <- abs((chg_people / 
                          fdf[fdf$val==paste("n_",year, sep=""),c("b")])*100)
        if(chg_pct<=12){
          cc <- (ann.pc*.12)*chg_people
        } else if(chg_pct>12){
          cc <- (ann.pc*(chg_pct/100))*chg_people
        }
        return(as.numeric(cc))
      }
      allyrs <- Reduce(sum, lapply(yrlist, OneYrSavings, fdf=fdf))
      if(allyrs<0){
        return(paste("Cost savings of $",format(abs(allyrs), 
                                                big.mark=","),sep="")) 
      } else if(allyrs>0) {
        return(paste("Cost increase of $", format(abs(allyrs), 
                                                  big.mark=","), sep=""))
      }
    }
    
    
    GetOutputDF <- function(ST, allscens) {
      # Generate data frame of results for list of scenarios
      # Arguments:
      #   ST: state two-letter string (e.g., "MD")
      #   allscens: a list of forecast scenario
      # Returns:
      #   Data frame of results from PPF model
      
      GenRow <- function(ST, sc) {
        rs <-matrix(nrow=0, ncol=5)
        
        if(length(sc)==1){
          r <- matrix(c(GetCol1(sc), GetCol2(sc), 
                        GetCol3(StateProjections(ST, sc)), 
                        GetCol4(StateProjections(ST, sc)),
                        GetCol5(StateProjections(ST, sc), ST=ST)), 
                      nrow=1, ncol=5)
          rs <- rbind(rs, r)
        } else if(length(sc)>1){
          r <- matrix(c("Multiple",
                        paste(lapply(sc, GetCol2), collapse=", "),
                        GetCol3(StateProjections(ST, sc)), 
                        GetCol4(StateProjections(ST, sc)),
                        GetCol5(StateProjections(ST, sc), ST=ST)), 
                      nrow=1, ncol=5)
          rs <- rbind(rs, r)
        }
        return(rs)
      }
    
      outputdf <-as.data.frame(Reduce(rbind, lapply(allscens, GenRow, ST=ST)))
      names(outputdf) <- c("OffenseCategory", "Change forecast", 
                          "Prison population impact (compared to 2025 baseline)", 
                          "Effect on racial and ethnic makeup of prison population",
                          "Effect on state correctional spending by 2025")
      ReportHispanic <- function(ST){
        if(mean(re$hisp_f[re$state==ST]==1)){
          result <- 1
        } else if(mean(re$hisp_f[re$state==ST]==0)){
          result <- 0
        }
        return(result)
      }
      
      if(ReportHispanic(ST)==0){
        outputdf <- rbind.fill(outputdf, data.frame("OffenseCategory"="Note: state does not report data on ethnicity"))
      }
      
      return(outputdf)
    }
  
    