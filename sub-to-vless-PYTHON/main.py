import os
import json
import base64
import urllib.parse
import urllib.request
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor
from flask import Flask, render_template, request, jsonify
import hashlib
import time

app = Flask(__name__)

# Simple in-memory cache
cache_store = {}
CACHE_DURATION = 300  # 5 minutes

def get_cache(key):
    """Get from cache if not expired"""
    if key in cache_store:
        data, timestamp = cache_store[key]
        if time.time() - timestamp < CACHE_DURATION:
            return data
    return None

def set_cache(key, data):
    """Set cache with timestamp"""
    cache_store[key] = (data, time.time())

def fetch_subscription(url):
    """Fetch subscription content from URL with timeout optimization"""
    cache_key = hashlib.md5(url.encode()).hexdigest()
    cached = get_cache(cache_key)
    if cached:
        return cached
    
    try:
        req = urllib.request.Request(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Connection': 'close'
            }
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            content = response.read()
            
            # Try to decode as base64 first
            try:
                decoded = base64.b64decode(content).decode('utf-8')
                set_cache(cache_key, decoded)
                return decoded
            except:
                result = content.decode('utf-8')
                set_cache(cache_key, result)
                return result
    except Exception as e:
        raise Exception(f"Failed to fetch subscription: {str(e)}")

def parse_vless_json(content):
    """Parse VLESS JSON configuration - optimized"""
    try:
        data = json.loads(content)
        
        if isinstance(data, dict):
            configs = [data]
        elif isinstance(data, list):
            configs = data
        else:
            return []
        
        vless_configs = []
        for config in configs:
            if isinstance(config, dict):
                outbounds = config.get('outbounds', [])
                if not outbounds and 'protocol' in config:
                    outbounds = [config]
                
                for outbound in outbounds:
                    if isinstance(outbound, dict) and outbound.get('protocol') == 'vless':
                        vless_configs.append(outbound)
        
        return vless_configs
    except json.JSONDecodeError:
        lines = content.strip().split('\n')
        vless_uris = []
        for line in lines:
            line = line.strip()
            if line.startswith('vless://'):
                vless_uris.append({'raw_uri': line})
        return vless_uris
    except Exception as e:
        raise Exception(f"Failed to parse config: {str(e)}")

def extract_location_from_config(config):
    """Extract location info from config"""
    tag = config.get('tag', '')
    settings = config.get('settings', {})
    vnext = settings.get('vnext', [{}])[0] if settings.get('vnext') else {}
    address = vnext.get('address', '')
    
    # Try to guess location from address or tag
    location_keywords = {
        'us': '🇺🇸', 'usa': '🇺🇸', 'america': '🇺🇸',
        'uk': '🇬🇧', 'england': '🇬🇧', 'london': '🇬🇧',
        'de': '🇩🇪', 'germany': '🇩🇪', 'berlin': '🇩🇪',
        'fr': '🇫🇷', 'france': '🇫🇷', 'paris': '🇫🇷',
        'nl': '🇳🇱', 'netherlands': '🇳🇱', 'amsterdam': '🇳🇱',
        'ca': '🇨🇦', 'canada': '🇨🇦',
        'sg': '🇸🇬', 'singapore': '🇸🇬',
        'jp': '🇯🇵', 'japan': '🇯🇵', 'tokyo': '🇯🇵',
        'tr': '🇹🇷', 'turkey': '🇹🇷', 'istanbul': '🇹🇷',
    }
    
    search_text = (tag + ' ' + address).lower()
    for keyword, flag in location_keywords.items():
        if keyword in search_text:
            return flag
    return ''

def convert_to_vless_uri(config, index):
    """Convert VLESS config to URI format - optimized"""
    try:
        if 'raw_uri' in config:
            return config['raw_uri']
        
        settings = config.get('settings', {})
        vnext = settings.get('vnext', [{}])[0] if settings.get('vnext') else {}
        users = vnext.get('users', [{}])
        user = users[0] if users else {}
        
        uuid = user.get('id', user.get('uuid', ''))
        address = vnext.get('address', '')
        port = vnext.get('port', 443)
        
        stream = config.get('streamSettings', {})
        network = stream.get('network', 'tcp')
        security = stream.get('security', 'none')
        
        uri = f"vless://{uuid}@{address}:{port}"
        
        params = []
        params.append(f"type={network}")
        params.append(f"security={security}")
        
        if security in ['tls', 'reality']:
            tls_settings = stream.get('tlsSettings', stream.get('realitySettings', {}))
            sni = tls_settings.get('serverName', '')
            if sni:
                params.append(f"sni={sni}")
            
            if security == 'reality':
                pbk = tls_settings.get('publicKey', '')
                if pbk:
                    params.append(f"pbk={pbk}")
                sid = tls_settings.get('shortId', '')
                if sid:
                    params.append(f"sid={sid}")
                fp = tls_settings.get('fingerprint', '')
                if fp:
                    params.append(f"fp={fp}")
            
            alpn = tls_settings.get('alpn', [])
            if alpn:
                params.append(f"alpn={','.join(alpn)}")
        
        if network == 'ws':
            ws_settings = stream.get('wsSettings', {})
            path = ws_settings.get('path', '/')
            params.append(f"path={urllib.parse.quote(path)}")
            headers = ws_settings.get('headers', {})
            host = headers.get('Host', '')
            if host:
                params.append(f"host={host}")
        
        elif network == 'grpc':
            grpc_settings = stream.get('grpcSettings', {})
            service_name = grpc_settings.get('serviceName', '')
            if service_name:
                params.append(f"serviceName={urllib.parse.quote(service_name)}")
        
        elif network == 'tcp':
            tcp_settings = stream.get('tcSettings', {})
            header = tcp_settings.get('header', {})
            header_type = header.get('type', 'none')
            if header_type != 'none':
                params.append(f"headerType={header_type}")
        
        elif network == 'h2' or network == 'http':
            http_settings = stream.get('httpSettings', {})
            path = http_settings.get('path', '/')
            params.append(f"path={urllib.parse.quote(path)}")
            host = http_settings.get('host', [])
            if host:
                params.append(f"host={','.join(host)}")
        
        flow = user.get('flow', '')
        if flow:
            params.append(f"flow={flow}")
        
        if params:
            uri += '?' + '&'.join(params)
        
        tag = config.get('tag', f'Config {index}')
        uri += '#' + urllib.parse.quote(tag)
        
        return uri
        
    except Exception as e:
        return f"vless://error@0.0.0.0:0?error={str(e)}#Error_{index}"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/convert', methods=['POST'])
def convert():
    try:
        data = request.get_json()
        subscription_url = data.get('url', '').strip()
        custom_prefix = data.get('prefix', '').strip()
        include_location = data.get('includeLocation', False)
        
        if not subscription_url:
            return jsonify({'error': 'Subscription URL is required'}), 400
        
        # Fetch subscription
        content = fetch_subscription(subscription_url)
        
        # Parse configs
        configs = parse_vless_json(content)
        
        if not configs:
            return jsonify({'error': 'No VLESS configs found'}), 400
        
        # Generate emojis
        emojis = ['🚀', '⚡', '🔥', '💎', '🌟', '✨', '💫', '⭐', '🎯', '🎨', 
                  '🎭', '🎪', '🎬', '🎮', '🎲', '🎰', '🎳', '🎺', '🎸', '🎻', 
                  '🎹', '🎤', '🏆', '🏅', '🏈', '🏀', '⚽', '⚾', '🥎', '🏐',
                  '🏉', '🎾', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏',
                  '🥅', '⛳', '🎣', '🤿', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁']
        
        import random
        selected_emojis = random.sample(emojis, min(len(configs), len(emojis)))
        
        results = []
        for i, config in enumerate(configs, 1):
            emoji = selected_emojis[i-1] if i-1 < len(selected_emojis) else '🔷'
            
            # Build name
            if custom_prefix:
                name = f"{emoji} {custom_prefix} {i}"
            else:
                name = f"{emoji} Made By Valtor {i}"
            
            # Add location if requested
            if include_location:
                location = extract_location_from_config(config)
                if location:
                    name = f"{location} {name}"
            
            uri = convert_to_vless_uri(config, i)
            
            # Update URI fragment
            if '#' in uri:
                uri = uri.split('#')[0] + '#' + urllib.parse.quote(name)
            else:
                uri += '#' + urllib.parse.quote(name)
            
            # Extract additional info
            settings = config.get('settings', {})
            vnext = settings.get('vnext', [{}])[0] if settings.get('vnext') else {}
            stream = config.get('streamSettings', {})
            
            results.append({
                'name': name,
                'uri': uri,
                'address': vnext.get('address', 'N/A'),
                'port': vnext.get('port', 'N/A'),
                'network': stream.get('network', 'tcp'),
                'security': stream.get('security', 'none')
            })
        
        return jsonify({
            'success': True,
            'configs': results,
            'count': len(results)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/validate', methods=['POST'])
def validate_url():
    """Quick URL validation endpoint"""
    try:
        data = request.get_json()
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'valid': False, 'message': 'URL is empty'})
        
        if not url.startswith(('http://', 'https://')):
            return jsonify({'valid': False, 'message': 'URL must start with http:// or https://'})
        
        return jsonify({'valid': True, 'message': 'URL is valid'})
    except:
        return jsonify({'valid': False, 'message': 'Validation error'})

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': time.time()})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
