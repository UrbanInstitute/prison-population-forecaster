import csv
import simplejson as json

def rounders(d,r):
	if (d == "NA"):
		return "null"
	else:
		return round(float(d), r) 

with open('race_test.csv', 'rb') as f:
    reader = csv.reader(f)
    rows = list(reader)

output = {}
# print output

for i in range(1, len(rows)):
	state = rows[i][1]
	category = rows[i][2]
	hisp_f = int(float(rows[i][3]))
	white = rounders(rows[i][4],4)
	black = rounders(rows[i][5],4)
	hispanic = rounders(rows[i][6],4)
	native = rounders(rows[i][7],4)
	asian = rounders(rows[i][8],4)
	hawaiian = rounders(rows[i][9],4)
	other = rounders(rows[i][10],4)


	if state not in output:
		output[state] = {}	

	if category not in output[state]:
		output[state][category] = {}
		output[state][category]["hisp_f"] = hisp_f
		output[state][category]["white"] = white
		output[state][category]["black"] = black
		output[state][category]["hispanic"] = hispanic
		output[state][category]["native"] = native
		output[state][category]["asian"] = asian
		output[state][category]["hawaiian"] = hawaiian
		output[state][category]["other"] = other
	
# print output

with open('race2.json', 'w') as f:	
    json.dump(output, f)    


