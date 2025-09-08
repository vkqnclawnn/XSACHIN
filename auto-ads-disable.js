// AdSense 자동 광고를 명시적으로 비활성화하는 스크립트
window.addEventListener('load', function() {
    // 자동 광고 비활성화
    if (window.adsbygoogle && window.adsbygoogle.loaded) {
        try {
            // 자동 광고 설정을 비활성화
            (adsbygoogle = window.adsbygoogle || []).push({
                google_ad_client: "ca-pub-9252126033352435",
                enable_page_level_ads: false,
                overlays: {bottom: false},
                anchor_ads: {enabled: false},
                vignette_ads: {enabled: false}
            });
        } catch (e) {
            console.log('Auto ads disable script error:', e);
        }
    }
});
