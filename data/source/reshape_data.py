import csv
import simplejson as json

def rounders(d,r):
	if (d == "NA"):
		return "null"
	else:
		return round(float(d), r) 

with open('usdata.csv', 'rb') as f:
    reader = csv.reader(f)
    rows = list(reader)

output = {}
# print output

for i in range(1, len(rows)):
	state = rows[i][8]
	category = rows[i][2]
	year = int(float(rows[i][3]))
	nt = rounders(rows[i][4],1)
	e = rounders(rows[i][5],1)
	l = rounders(rows[i][5],4)

	if state not in output:
		output[state] = {}
		output[state]["startYear"] = 3000
		output[state]["endYear"] = 1900
		output[state]["catList"] = []

	if category not in output[state]:
		output[state][category] = []
		output[state]["catList"].append(category)

	if (year < output[state]["startYear"]):
		output[state]["startYear"] = year

	if (year > output[state]["endYear"]):
		output[state]["endYear"] = year
	
	output[state][category].append([nt, e, l])


	# output[state]['zid'] = rows[i][0]
	# output[state]['stats'] = {}
	# output[state]['stats']['first'] = rows[i][1]
	# output[state]['stats']['last'] = rows[i][2]
	# output[state]['stats']['age'] = rows[i][3]
	
# print output

with open('usdata.json', 'w') as f:
    json.dump(output, f)    