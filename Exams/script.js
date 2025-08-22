// إذا ظهر هذا التنبيه، فالـ JS يعمل!
alert("ملف الجافاسكريبت يعمل بنجاح!");

// هذا الكود يتأكد من أن الـ JS يستطيع التفاعل مع الـ HTML
document.addEventListener('DOMContentLoaded', function() {
    const messageElement = document.getElementById('js-message');
    if (messageElement) {
        messageElement.textContent = "✅ تم تحديث هذا النص بواسطة الجافاسكريبت!";
        messageElement.style.color = "#a2ffb0";
        messageElement.style.fontWeight = "bold";
    }
});
