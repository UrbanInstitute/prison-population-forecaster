load("final_data_073118/costs_2015.RData")
load("final_data_073118/counts_2015.RData")
load("final_data_073118/race_ethnicity_2015.RData")

write.csv(sco, file="costs_test.csv")