# Prison Population Forecaster Version 3

Model.html is a work in progress. In the future it will run the commands found in 2_model_v2.R in javascript on Prison data (data/usdata.js).

## Model and Data file organization
 
### /data

```
┣━ costs.js
┣━ counts.js
┣━ race.js
┃ 	┗━ all the following are the
┃
┗━ /source	
	┣━ r2csv.R
	┃  	┗━ r script that transforms `final_data_073118/*` R data files into csvs. Run this file in the `/dada/source` directory. 
	┣━ reshape_data_counts.py
	┃  	┗━ Reshapes data from counts.csv into counts.json which is then changed to .js Run this file in the `/data/source` directory. 
	┣━ reshape_data_race.py
	┃  	┗━ Reshapes data from race.csv into race.json which is then changed to .js Run this file in the `/data/source` directory.
	┣━ race.csv
	┃  	┗━ intermediate race and ethnicity data file, a result of the `r2csv.R` script. Used in `reshape_data_race.py` to create `../race.js`, a json file with variable heading.
	┣━ counts.csv
	┃ 	┗━ intermediate counts data file, a result of the `r2csv.R` script. Used in `reshape_data_counts.py` to create `../counts.js`, a json file with variable heading.
	┗━ costs.csv
		┗━ intermediate costs data file, a result of the `r2csv.R` script. 
```	

┃
┗┓
┓┻

┣━
━
- 