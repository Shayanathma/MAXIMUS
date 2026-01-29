import requests
from dotenv import load_dotenv
import os

load_dotenv()  # load .env variables

token_endpoint = 'https://icdaccessmanagement.who.int/connect/token'
client_id = os.getenv('CLIENT_ID')
client_secret = os.getenv('CLIENT_SECRET')
scope = 'icdapi_access'
grant_type = 'client_credentials'

payload = {
    'client_id': client_id,
    'client_secret': client_secret,
    'scope': scope,
    'grant_type': grant_type
}

# get the OAUTH2 token
response = requests.post(token_endpoint, data=payload)
response.raise_for_status()  # check for request error
token = response.json().get('access_token')

uri = 'https://id.who.int/icd/entity'

headers = {
    'Authorization': 'Bearer ' + token,
    'Accept': 'application/json',
    'Accept-Language': 'en',
    'API-Version': 'v2'
}

r = requests.get(uri, headers=headers)
r.raise_for_status()

print(r.text)
