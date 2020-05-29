import matplotlib.pyplot as plt
import numpy as np
import codecs, json 


#f = lambda x,a : a * x**2
f = lambda x,theta,mu,sigma : np.exp((-(np.log(x-theta)-mu)**2)/(2*(sigma**2)))/(sigma*(x-theta)*np.sqrt(2*np.pi))

#set function parameters
theta=0
mu=9
sigma=1.9

#x = np.linspace(-200,8000)
domain = 50000
x = np.arange(0,domain, 1)
y2 = np.empty(domain)
y2.fill(0);
y = f(x,theta,mu,sigma)
y[0] = y[1] # Set a value for x=0

# Fit into uint48, max val 281474976710656
scale = 10e6;
sigFigs = 10e7;

# Output csv for distribution js emulation 
np.savetxt("log_normal_py.csv", y, delimiter=",")

# Break function into domain chunks for solidity
chunks = [5e3, 10e3, 20e3, 30e3, 40e3, 50e3] 
approx = np.empty(domain);
chunks.append(len(y))
chunkArrays = [[] for j in range(len(chunks))]

yHex = [int(y[i]*scale*sigFigs) for i in range(len(y))]


# TODO
#   - output edge cases for LNPDF_test
#   - output log10 icreasing x values above 50e3

maximum = np.max(y[1:]) 
maxX = 0
for i in range(len(y)):
    if y[i] == maximum:
        maxX = i
        print('Max x: {}'.format(i))

for i in range(len(chunks)):
    chunkSize = np.power(2, i+2)
    lower = 0 if i == 0 else chunkArrays[i-1][-1][1]
    for j in range(int(lower), int(chunks[i])):
    #for j in y[int(lower):int(chunks[i])]:
        if j%chunkSize == 0:
            integer = int(y[1]*scale*sigFigs/2) if np.isnan(y[j]) else int(y[j]*scale*sigFigs)
            chunkArrays[i].append((integer, j))
            approx[j] = integer

with open('lnpdf-values.sol', 'w') as f:
    f.write('// last val {0:#0{1}x};\n'.format(int(y[-1]*scale*sigFigs), 12))
    f.write('// uint40 maximum = {0:#0{1}x};\n'.format(int(maximum*scale*sigFigs), 12))
    f.write('// uint32 maxX = {};\n'.format(maxX))
    for chunk in range(len(chunks)):
        chunkSize = np.power(2, 2 + chunk) 
        if(len(chunkArrays[chunk])):
            f.write('uint40[{}] internal yArray{};\n'.format(len(chunkArrays[chunk]), chunkSize))

    f.write('\n')
    for chunk in range(1, len(chunks)):
        chunkSize = np.power(2, 1 + chunk) 
        #if(len(chunkArrays[chunk])):
        if True:
            f.write('// yArray{}\n'.format(chunkSize))
            print(len(chunkArrays[chunk]))
            lower = chunkArrays[chunk - 1][0]
            upper = chunkArrays[chunk][0] if len(chunkArrays[chunk]) else chunkArrays[chunk - 1][-1]
            f.write('else if(x >= {} && x < {}) {{\n'.format(lower[1], upper[1]))
            f.write('index = x - {};\n'.format(lower[1]))
            f.write('chunkSize = {};\n}}\n'.format(chunkSize))
            #f.write('y = yArray{}[index/{}];\n}}\n\n'.format(chunkSize, chunkSize))

    f.write('\n')
    for chunk in range(len(chunks)):
        #for i in range(len(chunkArrays[chunk])):
        #    chunkSize = np.power(2, 2 + chunk) 
        #    val = chunkArrays[chunk][i]
        #    f.write('yArray{}[{}] = '.format(chunkSize, i))
        #    f.write('{0:#0{1}x};'.format(val[0], 12))
        #    f.write('\t\t//{}\n'.format(val[1]));
        #f.write('\n');

        chunkSize = np.power(2, 2 + chunk) 
        f.write('uint40[{}] internal yArray{} = [\n'.format(len(chunkArrays[chunk]), chunkSize))
        for i in range(len(chunkArrays[chunk])):
            val = chunkArrays[chunk][i]
            #f.write('0x{:02x}'.format(val[0]))
            f.write('{0:#0{1}x}'.format(val[0], 12))
            if i < len(chunkArrays[chunk]) - 1:
                f.write(',')
            f.write('\t\t//{}\n'.format(val[1]))
        f.write('];\n');

with open('lnpdf-values.js', 'w') as f:
    f.write('module.exports = {\n');
    for chunk in range(len(chunks)):
        #for i in range(len(chunkArrays[chunk])):
        #    chunkSize = np.power(2, 2 + chunk) 
        #    val = chunkArrays[chunk][i]
        #    f.write('yArray{}[{}] = '.format(chunkSize, i))
        #    f.write('{0:#0{1}x};'.format(val[0], 12))
        #    f.write('\t\t//{}\n'.format(val[1]));
        #f.write('\n');

        chunkSize = np.power(2, 2 + chunk) 
        #f.write('uint40[{}] internal yArray{} = [\n'.format(len(chunkArrays[chunk]), chunkSize))
        f.write('"{}": [\n'.format(chunkSize))
        for i in range(len(chunkArrays[chunk])):
            val = chunkArrays[chunk][i]
            #f.write('0x{:02x}'.format(val[0]))
            f.write('{0:#0{1}x}'.format(val[0], 12))
            if i < len(chunkArrays[chunk]) - 1:
                f.write(',')
            f.write('\t\t//{}\n'.format(val[1]))
        f.write('],\n');
    f.write('\n}');

json.dump(yHex, codecs.open('lnpdf-int_values.json', 'w', encoding='utf-8'), separators=(',', ':'), sort_keys=True, indent=4) ### this saves the array in .json format

# Generate plot
fig, ax = plt.subplots(1,2, figsize=(30,8))

ax[0].set_title("plot y = f(x,a)")
ax[0].plot(x,y) # .. "plot f"
#ax.plot(x,y2) # .. "plot f"
ax[1].set_title("plot y = f(x,a)")
ax[1].plot(x,approx) # .. "plot f"
#ax[1].set_yscale("linear", nonposy='clip')
#plt.show()

#y2 = np.log10(y)

#plot the resulting arrays

#ax[1].set_title("plot np.log10(y)")
#ax[2].set_yscale("log", nonposy='clip')
#ax[2].plot(x,y) # .. "plot f on logarithmic scale"
