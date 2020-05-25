import matplotlib.pyplot as plt
import numpy as np

#define the function
#f = lambda x,a : a * x**2
f = lambda x,theta,mu,sigma : np.exp((-(np.log(x-theta)-mu)**2)/(2*(sigma**2)))/(sigma*(x-theta)*np.sqrt(2*np.pi))

#set values
#a=3.1

theta=0
mu=9
sigma=1.9

domain = 50000
#x = np.linspace(-200,8000)
x = np.arange(0,domain, 1)
y2 = np.empty(domain)
y2.fill(0);

#calculate the values of the function at the given points
y = f(x,theta,mu,sigma)
#y2 = np.log10(y)
# y and y2 are now arrays which we can plot

#plot the resulting arrays

#ax[1].set_title("plot np.log10(y)")
#ax[1].plot(x,y2) # .. "plot logarithm of f"
#
#ax[2].set_title("plot y on log scale")
#ax[2].set_yscale("log", nonposy='clip')
#ax[2].plot(x,y) # .. "plot f on logarithmic scale"

# 1
# 2. TO hex

#for 


# Fit into uint48, max val 281474976710656
scale = 10e6;
sigFigs = 10e7;

approx = np.empty(domain);
np.savetxt("log_normal_py.csv", y, delimiter=",")

index = -1;
tmp = open('indexes.txt', 'w')


chunks = [5e3, 10e3, 20e3, 30e3, 40e3, 50e3] 

last = 0;
chunk = 0;

def write_val(i, index, n):
    tmp.write('{}\n'.format(i))
    integer = 0 if np.isnan(y[i]) else int(y[i]*scale*sigFigs)
    y2[i] = integer
    approx[i] = integer
    last = index
    f.write('yArray{}[{}] = 0x{:02x};\n'.format(chunkSize, int(index), integer))


chunks.append(len(y))
chunkArrays = [[] for j in range(len(chunks))]

for i in range(len(chunks)):
    chunkSize = np.power(2, i+2)
    lower = 0 if i == 0 else chunks[i-1]
    for j in range(int(lower), int(chunks[i])):
        if j%chunkSize == 0:
            integer = 0 if np.isnan(y[j]) else int(y[j]*scale*sigFigs)
            chunkArrays[i].append((integer, j))
            approx[j] = integer

with open('lnpdf-values.sol', 'w') as f:
    for chunk in range(len(chunks)):
        for i in range(len(chunkArrays[chunk])):
            chunkSize = np.power(2, 2 + chunk) 
            val = chunkArrays[chunk][i]
            f.write('yArray{}[{}] = 0x{:02x};\t\t//{}\n'.format(chunkSize, i, val[0], val[1]))


tmp.close()

fig, ax = plt.subplots(1,2, figsize=(30,8))

ax[0].set_title("plot y = f(x,a)")
ax[0].plot(x,y) # .. "plot f"
#ax.plot(x,y2) # .. "plot f"
ax[1].set_title("plot y = f(x,a)")
ax[1].plot(x,approx) # .. "plot f"
plt.show()
