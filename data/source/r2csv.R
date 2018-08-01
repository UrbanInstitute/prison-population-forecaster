load("final_data_073118/costs_2015.RData")
load("final_data_073118/counts_2015.RData")
load("final_data_073118/race_ethnicity_2015.RData")

write.csv(co, file="costs_test.csv")
write.csv(counts.allstates, file="counts_test.csv")
write.csv(re, file="race_test.csv")

# From the CSVs, they are turned into JSON using the python scripts (for race and counts) and by "hand" in sublime (batch editing/copying/pasting/searching/etc) for costs