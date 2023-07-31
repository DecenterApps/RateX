import re
import json

{
    "ticker": "USDC",
    "address": {
        "1": "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6",
        "42161": "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3"
    },
    "ABI": []
},

# Ethereum - 1
with open('ethereum.html', 'r') as e:
    dataEth = e.read()

currencyE = re.findall('</a></span>.{0,50}</div>', dataEth)
addrE = re.findall('data-clipboard-text=".{0,60}"', dataEth)
dE = {}
for i, j in zip(currencyE, addrE):
    x = i.replace("</a></span>", '').replace('</div>', '')
    if not 'USD' in x:
        continue

    x = x.replace(' / USD', '')
    y = j.replace('data-clipboard-text="','').replace('"><img src="', '')
    y = y.replace('"', '')
    print(f'{x}: {y}')
    dE[x] = y

# Arbitrum - 42161
with open('arbitrum.html', 'r') as a:
    dataArb = a.read()

currencyA = re.findall('</a></span>.{0,50}</div>', dataArb)
addrA = re.findall('data-clipboard-text=".{0,60}"', dataArb)
dA = {}
for i, j in zip(currencyA, addrA):
    x = i.replace("</a></span>", '').replace('</div>', '')
    if not 'USD' in x:
        continue

    x = x.replace(' / USD', '')
    y = j.replace('data-clipboard-text="','').replace('"><img src="', '')
    y = y.replace('"', '')
    # print(f'{x}: {y}')
    dA[x] = y


# Optimism - 10
with open('optimism.html', 'r') as o:
    dataOpt = o.read()

currencyO = re.findall('</a></span>.{0,50}</div>', dataOpt)
addrO = re.findall('data-clipboard-text=".{0,60}"', dataOpt)
dO = {}
for i, j in zip(currencyO, addrO):
    x = i.replace("</a></span>", '').replace('</div>', '')
    if not 'USD' in x:
        continue

    x = x.replace(' / USD', '')
    y = j.replace('data-clipboard-text="','').replace('"><img src="', '')
    y = y.replace('"', '')
    # print(f'{x}: {y}')
    dO[x] = y