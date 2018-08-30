# FILE: 
#    get_results.R
# PURPOSE: 
#    Based on user defined input, produce and save PPF forecast results

library(plyr)
library(here)

# LOAD RAW DATA

# counts of admissions/releases/population (by state, offense & year)
  load(here("PPF_RawFiles", "counts_2015.RData"))
# annual per capita correctional costs data (by state)
  load(here("PPF_RawFiles", "costs_2015.RData"))
# data on race/ethnicity breakdowns (by state, by offense)
  load(here("PPF_RawFiles", "race_ethnicity_2015.RData"))
# longer offense category strings corresponding to short categories
  cat.names <- read.csv(here("PPF_RawFiles", "ppf_cat_names.csv"))

# LOAD PPF FUNCTIONS

  source(here("PPF_Model", "model_forecasts.R"))
  source(here("PPF_Model", "display_model_output.R"))


# NOTES:

#  Scenario: a list of changes to admissions/length of stay by offense category
#    -takes the form of list(c("offensestring", pctchange, changetype))
#   -within each sublist:
#     -offensestring: offense category string
#     -pctchange: number between -1 and 1 indicating percent change
#     -changetype: either 1 or 2, flags whether this change applies to either: 
#         -admissions (==1) or 
#         -length of stay (==2)
#   -Ex: list(c("drugposs", -.5, 1), c("burglary", .2, 2))
#     -this scenario would model a 50% reduction in admissions for drug 
#      possession and a 20% increase in length of stay for burglary
#      
# Possible values of offensestring are listed in ppf_cat column of cat.names 
# dataframe (loaded above)
  
 
# PRODUCE RESULTS

# 1. Define forecast scenarios sc1 - scN

  #[fill in your scenarios of interest here]
  #Note: scenarios can contain multiple changes (e.g. sc2 below)
  # Ex: 
  
  sc1 <- list(c("burglary", -.2, 2)) 
  sc2 <- list(c("robbery", -.1, 1), c("larceny", -.1, 2))
  sc3 <- list(c("drugposs", .2, 1))
  
# 2. Define forecast scenario list

  #[fill in scenarios you defined in step 1]
  # Ex: 
  
  list.of.scenarios <- list(sc1, sc2, sc3)
  
# 3. Produce table of results and save as CSV

  #[fill in the two-letter abbreviation for state of interest]
  # Ex: 
  
  output.df <- GetOutputDF("AL", list.of.scenarios)
  
  #or:
  #output.df <- GetOutputDF("FL", list.of.scenarios)
  
  
  write.csv(output.df, file=here("PPF_Results", "SampleScenario.csv"), 
            row.names=FALSE)

  

  
  
  
  
