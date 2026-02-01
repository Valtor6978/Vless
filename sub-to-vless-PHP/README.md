# 🔥 VLESS Converter Pro - PHP Version for cPanel

Professional VLESS subscription converter with purple theme and advanced features.

## 📁 File Structure

```
vless-converter-php/
├── index.html              # Main page
├── api.php                 # Backend API
├── .htaccess              # Apache configuration
├── assets/
│   ├── css/
│   │   └── style.css      # Styles
│   └── js/
│       └── script.js      # JavaScript
└── README.md              # This file
```

## 🚀 Installation on cPanel

### Method 1: File Manager (Recommended)

1. **Login to cPanel**
   - Go to your hosting cPanel

2. **Open File Manager**
   - Navigate to `public_html` folder

3. **Upload Files**
   - Click "Upload" button
   - Upload all files maintaining the structure:
     ```
     public_html/
     ├── index.html
     ├── api.php
     ├── .htaccess
     └── assets/
         ├── css/
         │   └── style.css
         └── js/
             └── script.js
     ```

4. **Set Permissions**
   - Right-click on `api.php` → Change permissions → Set to `644`
   - Right-click on `.htaccess` → Change permissions → Set to `644`

5. **Done!**
   - Visit: `https://yourdomain.com`

### Method 2: FTP Upload

1. **Connect via FTP**
   - Use FileZilla or any FTP client
   - Connect to your hosting

2. **Upload to public_html**
   - Upload all files to `/public_html/`

3. **Visit Your Site**
   - Go to `https://yourdomain.com`

### Method 3: Subdirectory Installation

If you want to install in a subdirectory (e.g., `yourdomain.com/converter`):

1. Create folder: `public_html/converter/`
2. Upload all files there
3. Visit: `https://yourdomain.com/converter/`

## ⚙️ Requirements

- **PHP**: 7.0 or higher
- **cURL**: Enabled (usually enabled by default)
- **Session Support**: Enabled

### Check Requirements

Create a file `check.php` with:

```php
<?php
phpinfo();
?>
```

Upload it and visit `yourdomain.com/check.php` to verify PHP version and extensions.

## 🔧 Configuration

### Enable cURL (if disabled)

1. Go to cPanel → "Select PHP Version"
2. Click "Extensions"
3. Enable "curl"
4. Save

### Increase PHP Limits

If you get timeout errors:

1. Go to cPanel → "MultiPHP INI Editor"
2. Increase these values:
   ```
   max_execution_time = 60
   memory_limit = 256M
   ```

## ✨ Features

- ⚡ **Fast Performance** - Caching system (5 minutes)
- 🎨 **Purple Modern Design** - Beautiful glassmorphism UI
- 🔧 **Advanced Settings** - Custom names, location flags
- 🔍 **Search & Filter** - Find configs easily
- 📥 **Export Options** - Copy all or download
- 📱 **Mobile First** - Perfect on all devices
- ⌨️ **Keyboard Shortcuts** - Ctrl+K, Ctrl+A, Escape

## 🎯 Usage

1. Enter subscription URL
2. Click "Advanced Settings" for options (optional)
3. Click "Convert"
4. Copy individual configs or all at once
5. Download as text file if needed

## 🔍 Troubleshooting

### Issue: "Failed to fetch subscription"

**Solutions:**
- Check if cURL is enabled
- Verify subscription URL is correct
- Check if your server can access external URLs
- Contact hosting support if firewall blocks outgoing requests

### Issue: Blank page or errors

**Solutions:**
- Check PHP error log in cPanel
- Verify PHP version (7.0+)
- Check file permissions (644 for .php files)
- Enable error reporting temporarily:
  ```php
  // Add to top of api.php
  error_reporting(E_ALL);
  ini_set('display_errors', 1);
  ```

### Issue: Session errors

**Solutions:**
- Check if sessions directory is writable
- Contact hosting support to enable sessions

### Issue: Slow performance

**Solutions:**
- Clear browser cache
- Ask hosting to increase PHP limits
- Check server resources

## 🔒 Security

- ✅ Input validation on all user inputs
- ✅ Secure headers in .htaccess
- ✅ Session-based caching (memory only)
- ✅ No data stored permanently
- ✅ XSS protection enabled
- ✅ CSRF protection via same-origin policy

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Opera (latest)
- ✅ Mobile browsers

## 🆙 Updates

To update:
1. Backup your current files
2. Download new version
3. Replace files (keep `.htaccess` if customized)
4. Clear browser cache

## 💡 Tips

### Custom Domain

If using a subdomain:
1. Create subdomain in cPanel
2. Upload files to subdomain's root
3. Visit subdomain URL

### HTTPS

Enable SSL/TLS in cPanel for security:
1. cPanel → "SSL/TLS Status"
2. Click "Run AutoSSL"

### Custom Styling

Edit `assets/css/style.css` to change colors:

```css
:root {
    --primary: #8b5cf6;  /* Change this */
    --secondary: #ec4899; /* And this */
}
```

## 📞 Support

For issues:
1. Check this README
2. Check PHP error logs
3. Contact hosting support
4. Report bugs via GitHub (if available)

## 📄 License

MIT License - Free to use

## 🙏 Credits

Made with 💜 by **Valtor**

---

**Version**: 2.0.0  
**Last Updated**: 2025  
**Status**: Production Ready 🚀
