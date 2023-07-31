import re
import json

def update_json_with_data(json_file, data_to_update, chainId):
    # Read the existing JSON data
    with open(json_file, 'r') as f:
        existing_data = json.load(f)

    # Update the existing data with the provided data_to_update
    for entry in existing_data:
        ticker = entry['ticker']
        if ticker in data_to_update:
            data = data_to_update[ticker]
            entry['address'][chainId] = data

    # Write the updated data back to the JSON file
    with open(json_file, 'w') as f:
        json.dump(existing_data, f, indent=4)

def process_data_first(file_name, chain_id):
    with open(file_name, 'r') as f:
        data = f.read()

    currency = re.findall('</a></span>.{0,50}</div>', data)
    addr = re.findall('data-clipboard-text=".{0,60}"', data)
    
    nekiData = {}
    for i, j in zip(currency, addr):
        x = i.replace("</a></span>", '').replace('</div>', '')
        if not 'USD' in x:
            continue

        x = x.replace(' / USD', '')
        y = j.replace('data-clipboard-text="','').replace('"><img src="', '')
        y = y.replace('"', '')
        
        # Create a JSON object for each entry
        # entry = {
        #     "ticker": x,
        #     "address": {
        #         "1": y,
        #     },
        #     "ABI": []
        # }
        
        # data_list.append(entry)

        nekiData[x] = y
    return nekiData


# arbitrum_data = process_data_first('arbitrum.html', 42161)
# update_json_with_data('combined_data.json', arbitrum_data, 42161)

optimism_data = process_data_first('optimism.html', 10)
update_json_with_data('combined_data.json', optimism_data, 10)
