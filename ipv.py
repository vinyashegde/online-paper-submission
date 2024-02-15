import requests
from bs4 import BeautifulSoup
import webbrowser

def get_public_ip():
    try:
        response = requests.get('https://api64.ipify.org?format=json')
        data = response.json()
        return data['ip']
    except requests.RequestException as e:
        print(f"Error getting public IP: {e}")
        return None

def main():
    allowed_ips = ['127.0.0.1', '192.168.1.1','111.125.221.191']  # Replace with the allowed IP addresses

    public_ip = get_public_ip()

    if public_ip in allowed_ips:
        url_allowed = "https://vinyashegde.github.io/online-paper-submission"
        webbrowser.open(url_allowed)
    else:
        url_not_allowed = "https://error.op"
        webbrowser.open(url_not_allowed)

if __name__ == "__main__":
    main()
