# Prison Population Forecaster

The Prison Population Forecaster (PPF) produces estimates of the impact of policy changes on state prison populations. Users define "forecast scenarios," which include changes to admissions and length of stay by offense category. The PPF model produces estimates of the impact of these changes on (1) the size of state prison populations, (2) the racial and ethnic makeup of state prison populations, and (3) state correctional spending.

## Getting Started

Download all files in the PPF_Final_Public folder. Use RStudio to open the project "PPF_Final_Public.RProj".

### Prerequisites

Install the following packages:

```
install.packages("plyr")
install.packages("here")
```

### Loading PPF Files and Functions

Open get_results.R in the PPF_Model folder. Run the following code to load the data files and functions that you will need.

```
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
```

## Defining Forecaster Scenarios

### Scenario Format 
Policy change scenarios take the form `list(c("offensestring", pctchange, chgtype))`, where:
* **"offensestring"** is a string indicating which offense category the change will apply to
* **pctchange** is a value between -1 and 1 indicating the percent change that will be applied to either admissions or length of stay (e.g., 0.2 for a 20% increase or -0.1 for a 10% decrease)
* **chgtype** takes the value of either 1 (representing a change to admissions) or 2 (representing a change to length of stay)

For example, the following scenario would model a 50% reduction in admissions for drug possession:
```
examplescen1 <- list(c("drugposs", -.5, 1))
```
The following scenario would model a 20% increase in length of stay for burglary:
```
examplescen2 <- list(c("burglary", .2, 2))
```

Multiple scenarios may be combined to forecast the combined effect of multiple policy changes. The same offense category can be included twice to reflect one change to admissions for that offense and one change to length of stay for that offense. 
```
examplescen3 <- list(c("burglary", -.1, 1), c("burglary", -.3, 2), c("drugtraff", -.1, 1))
```
However, two scenarios that both change admissions or length of stay for the same offense cannot be included. An example of what NOT to do is the scenario `list(c("burglary", -.1, 1), c("burglary", -.4, 1))`. This scenario contradicts itself as it defines two different changes to admissions for the same offense category.

### Valid Offense Categories

The following strings are valid entries for offstring:

* `arson`: Arson
* `assault`: Assault
* `burglary`: Burglary
* `drugposs`: Drug possession
* `drugtraff`: Drug trafficking
* `dwi`: DWI
* `fraud`: Fraud
* `homicide`: Homicide
* `kidnapping`: Kidnapping
* `larceny`: Theft
* `otherdrug`: Other drug offenses
* `otherprop`: Other property offenses
* `otherviol`: Other violent offenses
* `public_oth`: Public order/other
* `robbery`: Robbery
* `sexassault`: Sexual assault
* `weapons`: Weapons offenses
* `mvtheft`: Motor vehicle theft

Note that not all states report data on all of these offense categories. Determine which categories are valid for the state you're interested in by using this code (replace the "AL" state string with the two-letter code for whichever state you're interested in. This will list all of the valid categories. Only use categories that are contained within the state's data in your scenarios.

```
validcats.AL <- factor(unique(counts.allstates$ppf_cat[counts.allstates$state=="AL"]))
validcats.AL
```
In addition, the following strings may be used to indicate changes to umbrella categories of offenses. This will model the same change across all subcategories of the umbrella (as listed below). 

* `drug`: All drug offenses (drug possession, drug trafficking, other drug offenses)
* `property`: All property offenses (arson, burglary, fraud, larceny, other property offenseS)
* `violent`: All violent offenses (assault, homicide, kidnapping, robbery, sexual assault, other violent offenses)
* `other`: All other offenses (DWI, weapons offenses, public order/other offenses)
* `nonviolent`: All nonviolent offenses (all drug, property, and other)

Do not use an umbrella category in the same scenario in conjunction the same type of change to one of its subcategories.

For example, DON'T use this as a scenario: `list(c("drug", -.2, 1), c("drugposs", .3, 1))`

Instead, use this: `list(c("drugtraff", -.2, 1), c("otherdrug", -.2, 1), c("drugposs", -.3, 1))`


## Generating Forecaster Results

First, define any number of individual scenarios you'd like to forecast the results of. The scenarios may contain a single change to admissions or length of stay or they may contain multiple changes.

```
sc1 <- list(c("burglary", -.2, 2)) 
sc2 <- list(c("robbery", -.1, 1), c("larceny", -.1, 2))
sc3 <- list(c("drugposs", .2, 1))
```

You can name the scenarios anything you'd like. Then, combine all the scenarios you've just defined in a list called `list.of.scenarios`. 

```
list.of.scenarios <- list(sc1, sc2, sc3)
```

Finally, use the following code to define a data frame with forecaster results for whichever state you're interested in, using the function GetOutputDF. That function takes two arguments: a two-letter state string (e.g., "MD", "DC", "WA"), and the `list.of.scenarios` you just defined.

```
output.df <- GetOutputDF("AL", list.of.scenarios)
```

Save the output as a csv in the "PPF_Results" folder (which you downloaded earlier) using the following code. Fill in your own file name to replace "TestScenario.csv."

```
write.csv(output.df, file=here("PPF_Results", "TestScenario.csv"), 
            row.names=FALSE)
```


## Authors

* **Elizabeth Pelletier** 
* **Bryce Peterson**
* **Ryan King**

## Credits
For full credits, acknowledgments, and methodology please see the PPF online at https://urbn.is/ppf. 