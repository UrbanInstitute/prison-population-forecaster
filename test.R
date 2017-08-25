library(foreign)
#library(xlsx)
library(tidyr)
library(plyr)
library(ggplot2)
library(scales)

StateProjections <- function(ST, scenarios.list) { 
	# print(ST)	
  	# print(scenarios.list)	
	# print(scenarios.list[[1]][1])	
	STfile <- subset(counts.allstates, counts.allstates$state==ST)
	
}



load("costs.RData")
load("counts.RData")

test1 <- list(c("burglary", -.5, 2), c("drug", -.2, 1))
test2 <- list(c("other", -.1, 1))


StateProjections("AZ", test2)
# StateProjections("WA", test1)

