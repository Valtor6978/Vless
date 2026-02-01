<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple in-memory cache using sessions
session_start();
if (!isset($_SESSION['cache'])) {
    $_SESSION['cache'] = [];
}

function get_cache($key) {
    $cache_duration = 300; // 5 minutes
    if (isset($_SESSION['cache'][$key])) {
        $data = $_SESSION['cache'][$key];
        if (time() - $data['timestamp'] < $cache_duration) {
            return $data['content'];
        }
        unset($_SESSION['cache'][$key]);
    }
    return null;
}

function set_cache($key, $content) {
    $_SESSION['cache'][$key] = [
        'content' => $content,
        'timestamp' => time()
    ];
}

function fetch_subscription($url) {
    $cache_key = md5($url);
    $cached = get_cache($cache_key);
    if ($cached !== null) {
        return $cached;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    $content = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("Failed to fetch subscription: " . $error);
    }
    
    // Try to decode as base64
    $decoded = base64_decode($content, true);
    if ($decoded !== false && mb_detect_encoding($decoded, 'UTF-8', true)) {
        $content = $decoded;
    }
    
    set_cache($cache_key, $content);
    return $content;
}

function parse_vless_json($content) {
    $data = json_decode($content, true);
    
    if (json_last_error() === JSON_ERROR_NONE) {
        if (isset($data['outbounds']) || isset($data['protocol'])) {
            $configs = is_array($data) && !isset($data['protocol']) ? $data : [$data];
        } else {
            $configs = is_array($data) ? $data : [$data];
        }
        
        $vless_configs = [];
        foreach ($configs as $config) {
            if (!is_array($config)) continue;
            
            $outbounds = isset($config['outbounds']) ? $config['outbounds'] : [];
            if (empty($outbounds) && isset($config['protocol'])) {
                $outbounds = [$config];
            }
            
            foreach ($outbounds as $outbound) {
                if (is_array($outbound) && isset($outbound['protocol']) && $outbound['protocol'] === 'vless') {
                    $vless_configs[] = $outbound;
                }
            }
        }
        
        return $vless_configs;
    }
    
    // Try parsing as VLESS URIs
    $lines = explode("\n", trim($content));
    $vless_uris = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, 'vless://') === 0) {
            $vless_uris[] = ['raw_uri' => $line];
        }
    }
    
    return $vless_uris;
}

function extract_location_from_config($config) {
    $tag = isset($config['tag']) ? $config['tag'] : '';
    $settings = isset($config['settings']) ? $config['settings'] : [];
    $vnext = isset($settings['vnext'][0]) ? $settings['vnext'][0] : [];
    $address = isset($vnext['address']) ? $vnext['address'] : '';
    
    $location_keywords = [
        'us' => '🇺🇸', 'usa' => '🇺🇸', 'america' => '🇺🇸',
        'uk' => '🇬🇧', 'england' => '🇬🇧', 'london' => '🇬🇧',
        'de' => '🇩🇪', 'germany' => '🇩🇪', 'berlin' => '🇩🇪',
        'fr' => '🇫🇷', 'france' => '🇫🇷', 'paris' => '🇫🇷',
        'nl' => '🇳🇱', 'netherlands' => '🇳🇱', 'amsterdam' => '🇳🇱',
        'ca' => '🇨🇦', 'canada' => '🇨🇦',
        'sg' => '🇸🇬', 'singapore' => '🇸🇬',
        'jp' => '🇯🇵', 'japan' => '🇯🇵', 'tokyo' => '🇯🇵',
        'tr' => '🇹🇷', 'turkey' => '🇹🇷', 'istanbul' => '🇹🇷',
    ];
    
    $search_text = strtolower($tag . ' ' . $address);
    foreach ($location_keywords as $keyword => $flag) {
        if (strpos($search_text, $keyword) !== false) {
            return $flag;
        }
    }
    
    return '';
}

function convert_to_vless_uri($config, $index) {
    try {
        if (isset($config['raw_uri'])) {
            return $config['raw_uri'];
        }
        
        $settings = isset($config['settings']) ? $config['settings'] : [];
        $vnext = isset($settings['vnext'][0]) ? $settings['vnext'][0] : [];
        $users = isset($vnext['users'][0]) ? $vnext['users'][0] : [];
        
        $uuid = isset($users['id']) ? $users['id'] : (isset($users['uuid']) ? $users['uuid'] : '');
        $address = isset($vnext['address']) ? $vnext['address'] : '';
        $port = isset($vnext['port']) ? $vnext['port'] : 443;
        
        $stream = isset($config['streamSettings']) ? $config['streamSettings'] : [];
        $network = isset($stream['network']) ? $stream['network'] : 'tcp';
        $security = isset($stream['security']) ? $stream['security'] : 'none';
        
        $uri = "vless://{$uuid}@{$address}:{$port}";
        
        $params = [];
        $params[] = "type={$network}";
        $params[] = "security={$security}";
        
        if ($security === 'tls' || $security === 'reality') {
            $tls_settings = isset($stream['tlsSettings']) ? $stream['tlsSettings'] : 
                           (isset($stream['realitySettings']) ? $stream['realitySettings'] : []);
            
            $sni = isset($tls_settings['serverName']) ? $tls_settings['serverName'] : '';
            if ($sni) {
                $params[] = "sni={$sni}";
            }
            
            if ($security === 'reality') {
                if (isset($tls_settings['publicKey'])) {
                    $params[] = "pbk={$tls_settings['publicKey']}";
                }
                if (isset($tls_settings['shortId'])) {
                    $params[] = "sid={$tls_settings['shortId']}";
                }
                if (isset($tls_settings['fingerprint'])) {
                    $params[] = "fp={$tls_settings['fingerprint']}";
                }
            }
            
            if (isset($tls_settings['alpn']) && is_array($tls_settings['alpn'])) {
                $params[] = "alpn=" . implode(',', $tls_settings['alpn']);
            }
        }
        
        if ($network === 'ws') {
            $ws_settings = isset($stream['wsSettings']) ? $stream['wsSettings'] : [];
            $path = isset($ws_settings['path']) ? $ws_settings['path'] : '/';
            $params[] = "path=" . urlencode($path);
            
            $headers = isset($ws_settings['headers']) ? $ws_settings['headers'] : [];
            if (isset($headers['Host'])) {
                $params[] = "host={$headers['Host']}";
            }
        } elseif ($network === 'grpc') {
            $grpc_settings = isset($stream['grpcSettings']) ? $stream['grpcSettings'] : [];
            if (isset($grpc_settings['serviceName'])) {
                $params[] = "serviceName=" . urlencode($grpc_settings['serviceName']);
            }
        } elseif ($network === 'tcp') {
            $tcp_settings = isset($stream['tcSettings']) ? $stream['tcSettings'] : [];
            $header = isset($tcp_settings['header']) ? $tcp_settings['header'] : [];
            $header_type = isset($header['type']) ? $header['type'] : 'none';
            if ($header_type !== 'none') {
                $params[] = "headerType={$header_type}";
            }
        }
        
        $flow = isset($users['flow']) ? $users['flow'] : '';
        if ($flow) {
            $params[] = "flow={$flow}";
        }
        
        if (!empty($params)) {
            $uri .= '?' . implode('&', $params);
        }
        
        $tag = isset($config['tag']) ? $config['tag'] : "Config {$index}";
        $uri .= '#' . urlencode($tag);
        
        return $uri;
        
    } catch (Exception $e) {
        return "vless://error@0.0.0.0:0?error=" . urlencode($e->getMessage()) . "#Error_{$index}";
    }
}

// Main conversion endpoint
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $subscription_url = isset($input['url']) ? trim($input['url']) : '';
        $custom_prefix = isset($input['prefix']) ? trim($input['prefix']) : '';
        $include_location = isset($input['includeLocation']) ? $input['includeLocation'] : false;
        
        if (empty($subscription_url)) {
            http_response_code(400);
            echo json_encode(['error' => 'Subscription URL is required']);
            exit;
        }
        
        // Fetch subscription
        $content = fetch_subscription($subscription_url);
        
        // Parse configs
        $configs = parse_vless_json($content);
        
        if (empty($configs)) {
            http_response_code(400);
            echo json_encode(['error' => 'No VLESS configs found']);
            exit;
        }
        
        // Generate emojis
        $emojis = ['🚀', '⚡', '🔥', '💎', '🌟', '✨', '💫', '⭐', '🎯', '🎨', 
                   '🎭', '🎪', '🎬', '🎮', '🎲', '🎰', '🎳', '🎺', '🎸', '🎻', 
                   '🎹', '🎤', '🏆', '🏅', '🏈', '🏀', '⚽', '⚾', '🥎', '🏐',
                   '🏉', '🎾', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏'];
        
        shuffle($emojis);
        $selected_emojis = array_slice($emojis, 0, min(count($configs), count($emojis)));
        
        $results = [];
        foreach ($configs as $i => $config) {
            $index = $i + 1;
            $emoji = isset($selected_emojis[$i]) ? $selected_emojis[$i] : '🔷';
            
            // Build name
            if (!empty($custom_prefix)) {
                $name = "{$emoji} {$custom_prefix} {$index}";
            } else {
                $name = "{$emoji} Made By Valtor {$index}";
            }
            
            // Add location if requested
            if ($include_location) {
                $location = extract_location_from_config($config);
                if (!empty($location)) {
                    $name = "{$location} {$name}";
                }
            }
            
            $uri = convert_to_vless_uri($config, $index);
            
            // Update URI fragment
            if (strpos($uri, '#') !== false) {
                $uri = substr($uri, 0, strpos($uri, '#')) . '#' . urlencode($name);
            } else {
                $uri .= '#' . urlencode($name);
            }
            
            // Extract additional info
            $settings = isset($config['settings']) ? $config['settings'] : [];
            $vnext = isset($settings['vnext'][0]) ? $settings['vnext'][0] : [];
            $stream = isset($config['streamSettings']) ? $config['streamSettings'] : [];
            
            $results[] = [
                'name' => $name,
                'uri' => $uri,
                'address' => isset($vnext['address']) ? $vnext['address'] : 'N/A',
                'port' => isset($vnext['port']) ? $vnext['port'] : 'N/A',
                'network' => isset($stream['network']) ? $stream['network'] : 'tcp',
                'security' => isset($stream['security']) ? $stream['security'] : 'none'
            ];
        }
        
        echo json_encode([
            'success' => true,
            'configs' => $results,
            'count' => count($results)
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
