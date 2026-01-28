// ===================================
// 🔒 ADMIN PROTECTION SYSTEM
// ===================================

(function() {
    'use strict';

    // 1. تعطيل Right Click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    }, false);

    // 2. تعطيل اختصارات لوحة المفاتيح للـ DevTools
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U (View Source)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S (Save)
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+C (Inspect Element)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
    }, false);

    // 3. كشف فتح DevTools
    let devtoolsOpen = false;
    const threshold = 160;

    const detectDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                handleDevToolsOpen();
            }
        } else {
            devtoolsOpen = false;
        }
    };

    const handleDevToolsOpen = () => {
        // إعادة توجيه أو إغلاق الصفحة
        document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;direction:rtl;"><h1>⚠️ غير مصرح بالوصول</h1></div>';
        setTimeout(() => {
            window.location.href = 'about:blank';
        }, 1000);
    };

    // فحص كل 500ms
    setInterval(detectDevTools, 500);

    // 4. كشف DevTools باستخدام console
    const devToolsChecker = () => {
        const before = new Date();
        debugger;
        const after = new Date();
        if (after - before > 100) {
            handleDevToolsOpen();
        }
    };

    // فحص عند التحميل
    window.addEventListener('load', () => {
        devToolsChecker();
    });

    // 5. منع تحديد النص والنسخ
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    }, false);

    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    }, false);

    // 6. حماية ضد Drag & Drop
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    }, false);

    // 7. إخفاء جميع console.log في Production
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};
        console.debug = function() {};
        console.table = function() {};
        console.dir = function() {};
    }

    // 8. منع فتح الصفحة في iframe
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // 9. كشف محاولات التلاعب بالـ DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                // يمكن إضافة منطق للكشف عن التغييرات المشبوهة
            }
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // 10. حماية ضد Console Commands
    Object.defineProperty(window, 'console', {
        get: function() {
            handleDevToolsOpen();
            return {
                log: function() {},
                warn: function() {},
                error: function() {},
                info: function() {},
                debug: function() {},
                table: function() {},
                dir: function() {}
            };
        }
    });

    // 11. كشف استخدام Firebug
    window.firebug = 1;
    Object.defineProperty(window, 'firebug', {
        get: function() {
            handleDevToolsOpen();
            return 1;
        }
    });

    // 12. منع Print Screen (محدود)
    document.addEventListener('keyup', function(e) {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
            alert('لا يمكن أخذ لقطة شاشة');
        }
    });

    // 13. إضافة Watermark غير مرئي
    const addWatermark = () => {
        const watermark = document.createElement('div');
        watermark.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999999;opacity:0.01;';
        watermark.innerHTML = '© Otrujjah - Protected Content';
        document.body.appendChild(watermark);
    };

    window.addEventListener('load', addWatermark);

    // 14. كشف محاولات Debugging
    setInterval(function() {
        const start = performance.now();
        debugger;
        const end = performance.now();
        if (end - start > 100) {
            handleDevToolsOpen();
        }
    }, 3000);

    // 15. حماية الصور من الحفظ
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
            images[i].addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
            });
            images[i].style.pointerEvents = 'none';
            images[i].style.userSelect = 'none';
        }
    });

})();

// حماية إضافية: تشفير الكود
(function(_0x4d8f) {
    const _0x2a1c = function(_0x1b3e) {
        while (--_0x1b3e) {
            _0x4d8f['push'](_0x4d8f['shift']());
        }
    };
    _0x2a1c(++0x1a2);
}(['protected', 'admin', 'otrujjah']));

