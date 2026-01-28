// ===================================
// 🔒 CLIENT PROTECTION SYSTEM
// ===================================

(function() {
    'use strict';

    // 1. تعطيل Right Click
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    }, false);

    // 2. تعطيل اختصارات لوحة المفاتيح
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
        // Ctrl+U
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
    }, false);

    // 3. كشف DevTools
    let devtoolsOpen = false;
    const detectDevTools = () => {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if (widthThreshold || heightThreshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                // يمكن إضافة إجراء هنا (مثل إخفاء المحتوى الحساس)
            }
        } else {
            devtoolsOpen = false;
        }
    };

    setInterval(detectDevTools, 1000);

    // 4. منع تحديد النص (اختياري - قد يزعج المستخدمين)
    // document.addEventListener('selectstart', function(e) {
    //     e.preventDefault();
    //     return false;
    // }, false);

    // 5. منع النسخ
    document.addEventListener('copy', function(e) {
        e.clipboardData.setData('text/plain', 'المحتوى محمي - © Otrujjah');
        e.preventDefault();
    }, false);

    // 6. إخفاء console في Production
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
        console.info = function() {};
        console.debug = function() {};
    }

    // 7. منع iframe
    if (window.top !== window.self) {
        window.top.location = window.self.location;
    }

    // 8. حماية الصور
    document.addEventListener('DOMContentLoaded', function() {
        const images = document.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
            images[i].addEventListener('contextmenu', function(e) {
                e.preventDefault();
                return false;
            });
            images[i].addEventListener('dragstart', function(e) {
                e.preventDefault();
                return false;
            });
        }
    });

    // 9. منع Print Screen
    document.addEventListener('keyup', function(e) {
        if (e.key === 'PrintScreen') {
            navigator.clipboard.writeText('');
        }
    });

})();

