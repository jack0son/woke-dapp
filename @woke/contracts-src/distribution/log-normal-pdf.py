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
y =  f(x,theta,mu,sigma)
#y2 = np.log10(y)
# y and y2 are now arrays which we can plot

#plot the resulting arrays
fig, ax = plt.subplots(1,1, figsize=(10,5))

ax.set_title("plot y = f(x,a)")
ax.plot(x,y) # .. "plot f"
ax.plot(x,y2) # .. "plot f"
#ax[0].set_title("plot y = f(x,a)")
#ax[0].plot(x,y) # .. "plot f"

#ax[1].set_title("plot np.log10(y)")
#ax[1].plot(x,y2) # .. "plot logarithm of f"
#
#ax[2].set_title("plot y on log scale")
#ax[2].set_yscale("log", nonposy='clip')
#ax[2].plot(x,y) # .. "plot f on logarithmic scale"


np.savetxt("log_normal_py.csv", y, delimiter=",")
plt.show()
