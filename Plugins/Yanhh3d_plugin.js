// =============================================================================
// 1. CONFIGURATION & METADATA (KHAI BÁO THÂN THẾ YANHH3D)
// =============================================================================
function getManifest() {
    return JSON.stringify({
        "id": "yanhh3d_web_v1",       
        "name": "YanHH3D",           
        "version": "1.0.1",          
        "baseUrl": "https://yanhh3d.sh",
        "iconUrl": "iconUrl": "https://raw.githubusercontent.com/namanhauto/pluginvax/main/Plugins/Yahh3d_logo.png", 
        "isEnabled": true,       
        "type": "MOVIE",
        "layoutType": "VERTICAL"
    });
}

function getHomeSections() {
    return JSON.stringify([
        { slug: 'trending', title: '🔥 Đề Cử / Xem Nhiều', type: 'Banner', path: 'danh-sach' },
        { slug: 'moi-cap-nhat', title: 'Mới Cập Nhật', type: 'Grid', path: 'danh-sach' },
        { slug: 'hoat-hinh-3d', title: 'Hoạt Hình 3D', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoat-hinh-2d', title: 'Hoạt Hình 2D', type: 'Horizontal', path: 'danh-sach' },
        { slug: 'hoan-thanh', title: 'Đã Hoàn Thành', type: 'Horizontal', path: 'danh-sach' }
    ]);
}

function getPrimaryCategories() {
    return JSON.stringify([
        { name: 'Huyền Huyễn', slug: 'huyen-huyen' },
        { name: 'Xuyên Không', slug: 'xuyen-khong' },
        { name: 'Trùng Sinh', slug: 'trung-sinh' },
        { name: 'Tiên Hiệp', slug: 'tien-hiep' },
        { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Kiếm Hiệp', slug: 'kiem-hiep' }
    ]);
}

function getFilterConfig() {
    return JSON.stringify({
        sort: [], 
        categories: [
            { name: 'Huyền Huyễn', slug: 'huyen-huyen', value: 'huyen-huyen' },
            { name: 'Xuyên Không', slug: 'xuyen-khong', value: 'xuyen-khong' },
            { name: 'Trùng Sinh', slug: 'trung-sinh', value: 'trung-sinh' },
            { name: 'Tiên Hiệp', slug: 'tien-hiep', value: 'tien-hiep' },
            { name: 'Cổ Trang', slug: 'co-trang', value: 'co-trang' },
            { name: 'Kiếm Hiệp', slug: 'kiem-hiep', value: 'kiem-hiep' },
            { name: 'Hài Hước', slug: 'hai-huoc', value: 'hai-huoc' },
            { name: 'Hiện Đại', slug: 'hien-dai', value: 'hien-dai' }
        ]
    });
}

// =============================================================================
// 2. URL GENERATION (TẠO ĐƯỜNG DẪN)
// =============================================================================
function getUrlList(slug, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        var finalSlug = slug;

        if (filters.category && filters.category !== "") {
            finalSlug = "the-loai/" + filters.category;
        }

        if (finalSlug === 'trending' || finalSlug === '') {
            return "https://yanhh3d.sh/";
        }

        return "https://yanhh3d.sh/" + finalSlug + "?page=" + page;
    } catch (e) {
        return "https://yanhh3d.sh/" + slug;
    }
}

function getUrlSearch(keyword, filtersJson) {
    try {
        var filters = JSON.parse(filtersJson || "{}");
        var page = filters.page || 1;
        return "https://yanhh3d.sh/search?keysearch=" + encodeURIComponent(keyword) + "&page=" + page;
    } catch (e) {
        return "https://yanhh3d.sh/search?keysearch=" + encodeURIComponent(keyword);
    }
}

function getUrlDetail(slug) {
    if (slug.indexOf('http') === 0) return slug;
    slug = slug.replace(/\/+$/, ''); 
    return "https://yanhh3d.sh/" + slug; 
}

function getUrlCategories() { return "https://yanhh3d.sh/"; }
function getUrlCountries() { return ""; }
function getUrlYears() { return ""; }

// =============================================================================
// 3. PARSERS: CÀO DANH SÁCH TỪ TRANG CHỦ
// =============================================================================
function parseListResponse(html) {
    try {
        var items = []; 
        var blocks = html.split('class="flw-item"'); 
        blocks.shift(); 

        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            
            var linkMatch = block.match(/href="([^"]+)"/i);
            var url = linkMatch ? linkMatch[1] : "";
            var id = url;
            if (url.indexOf('yanhh3d.sh/') > -1) {
                id = url.split('yanhh3d.sh/')[1].replace(/\/+$/, '');
            }

            var titleMatch = block.match(/title="([^"]+)"/i);
            var title = titleMatch ? titleMatch[1].trim() : "N/A";

            var posterMatch = block.match(/data-src="([^"]+)"/i);
            var posterUrl = posterMatch ? posterMatch[1] : "";

            var epiMatch = block.match(/tick-rate">([^<]+)<\/div>/i);
            var episode_current = epiMatch ? epiMatch[1].trim() : "";

            var qualityMatch = block.match(/tick-dub">([^<]+)<\/div>/i);
            var quality = qualityMatch ? qualityMatch[1].trim() : "HD";

            if (id && title !== "N/A") {
                items.push({
                    id: id,
                    title: title,
                    posterUrl: posterUrl,
                    backdropUrl: posterUrl,
                    year: 0,
                    quality: quality,
                    episode_current: episode_current,
                    lang: ""
                });
            }
        }

        return JSON.stringify({
            items: items,
            pagination: { currentPage: 1, totalPages: 50, totalItems: 1000, itemsPerPage: 20 }
        });
    } catch (error) {
        return JSON.stringify({ items: [], pagination: { currentPage: 1, totalPages: 1 } });
    }
}

function parseSearchResponse(html) { return parseListResponse(html); }

function parseCategoriesResponse(html) {
    return JSON.stringify([
        { name: 'Huyền Huyễn', slug: 'huyen-huyen', value: 'huyen-huyen' },
        { name: 'Xuyên Không', slug: 'xuyen-khong', value: 'xuyen-khong' },
        { name: 'Trùng Sinh', slug: 'trung-sinh', value: 'trung-sinh' },
        { name: 'Tiên Hiệp', slug: 'tien-hiep', value: 'tien-hiep' },
        { name: 'Cổ Trang', slug: 'co-trang', value: 'co-trang' },
        { name: 'Kiếm Hiệp', slug: 'kiem-hiep', value: 'kiem-hiep' },
        { name: 'Hài Hước', slug: 'hai-huoc', value: 'hai-huoc' },
        { name: 'Hiện Đại', slug: 'hien-dai', value: 'hien-dai' }
    ]);
}
function parseCountriesResponse(html) { return "[]"; }
function parseYearsResponse(html) { return "[]"; }

// =============================================================================
// 4. PARSER: CÀO CHI TIẾT & DANH SÁCH TẬP (CỰC KỲ PHỨC TẠP)
// =============================================================================
function parseMovieDetail(html) {
    try {
        var id = "unknown";
        var urlMatch = html.match(/<meta property="og:url" content="([^"]+)"/i);
        if (urlMatch && urlMatch[1]) {
            if (urlMatch[1].indexOf('yanhh3d.sh/') > -1) {
                id = urlMatch[1].split('yanhh3d.sh/')[1].replace(/\/+$/, '');
            }
        }

        var titleMatch = html.match(/<meta property="og:title" content="([^"]+)"/i);
        var title = titleMatch ? titleMatch[1].replace("Thuyết Minh", "").replace("Vietsub", "").trim() : "N/A";

        var posterMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        var posterUrl = posterMatch ? posterMatch[1] : "";

        var descMatch = html.match(/<meta property="og:description" content="([^"]+)"/i) || html.match(/class="film-description m-hide">[\s\S]*?<div class="text">([\s\S]*?)<\/div>/i);
        var description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim() : "Đang cập nhật nội dung...";

        // Bắt Năm phát hành (Nếu có)
        var yearMatch = html.match(/Năm:[\s\S]*?<span class="name">(\d{4})<\/span>/i);
        var year = yearMatch ? parseInt(yearMatch[1]) : 0;

        // Bắt Chất lượng và Trạng thái
        var qualityMatch = html.match(/Thời lượng:[\s\S]*?<span class="name">([^<]+)\[4K\]<\/span>/i);
        var quality = qualityMatch ? "4K" : "HD";

        // MÓC DANH SÁCH TẬP TỪ 2 TAB (THUYẾT MINH VÀ VIETSUB)
        var servers = [];
        
        // 1. Cào Tab Thuyết Minh
        var tmBlockMatch = html.match(/id="top-comment" class="tab-pane active">([\s\S]*?)<\/div>\s*<\/div>\s*<div id="new-comment"/i);
        if (tmBlockMatch) {
            var tmEpisodes = [];
            var epRegex = /<a class="ssl-item ep-item[^>]*href="([^"]+)" title="([^"]+)">/g;
            var match;
            while ((match = epRegex.exec(tmBlockMatch[1])) !== null) {
                var epUrl = match[1];
                var epSlug = epUrl.indexOf('yanhh3d.sh/') > -1 ? epUrl.split('yanhh3d.sh/')[1].replace(/\/+$/, '') : epUrl;
                tmEpisodes.push({ id: epSlug, name: "Tập " + match[2], slug: epSlug });
            }
            if(tmEpisodes.length > 0) servers.push({ name: "Thuyết Minh", episodes: tmEpisodes.reverse() }); // Đảo ngược mảng để Tập 1 lên đầu
        }

        // 2. Cào Tab Vietsub
        var vsBlockMatch = html.match(/id="new-comment" class="tab-pane">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/i);
        if (vsBlockMatch) {
            var vsEpisodes = [];
            var epRegex = /<a class="ssl-item ep-item[^>]*href="([^"]+)" title="([^"]+)">/g;
            var match;
            while ((match = epRegex.exec(vsBlockMatch[1])) !== null) {
                var epUrl = match[1];
                var epSlug = epUrl.indexOf('yanhh3d.sh/') > -1 ? epUrl.split('yanhh3d.sh/')[1].replace(/\/+$/, '') : epUrl;
                vsEpisodes.push({ id: epSlug, name: "Tập " + match[2], slug: epSlug });
            }
            if(vsEpisodes.length > 0) servers.push({ name: "Vietsub", episodes: vsEpisodes.reverse() });
        }

        return JSON.stringify({
            id: id, 
            title: title,
            posterUrl: posterUrl,
            backdropUrl: posterUrl,
            description: description,
            year: year,
            quality: quality,
            servers: servers 
        });
    } catch (error) { 
        return JSON.stringify({ servers: [] }); 
    }
}

// =============================================================================
// 5. PARSER: TÌM VÀ BÓC LINK VIDEO M3U8/IFRAME BỊ GIẤU TRONG JAVASCRIPT
// =============================================================================
function parseDetailResponse(html) {
    try {
        var videoUrl = "";

        // 1. Quét tìm tất cả các biến chứa link trong Javascript
        var checkLink1 = html.match(/var \$checkLink1 = "([^"]+)";/i);
        var checkLink2 = html.match(/var \$checkLink2 = "([^"]+)";/i);
        var checkLink3 = html.match(/var \$checkLink3 = "([^"]+)";/i);
        var checkLink4 = html.match(/var \$checkLink4 = "([^"]+)";/i);
        var checkLink5 = html.match(/var \$checkLink5 = "([^"]+)";/i);
        var checkLink6 = html.match(/var \$checkLink6 = "([^"]+)";/i);
        var checkLink7 = html.match(/var \$checkLink7 = "([^"]+)";/i);
        var checkLink8 = html.match(/var \$checkLink8 = "([^"]+)";/i);
        var checkLink9 = html.match(/var \$checkLink9 = "([^"]+)";/i);

        // 2. Thu thập các link tìm được vào 1 mảng
        var allLinks = [];
        if (checkLink1 && checkLink1[1] !== "") allLinks.push(checkLink1[1]);
        if (checkLink2 && checkLink2[1] !== "") allLinks.push(checkLink2[1]);
        if (checkLink3 && checkLink3[1] !== "") allLinks.push(checkLink3[1]);
        if (checkLink4 && checkLink4[1] !== "") allLinks.push(checkLink4[1]);
        if (checkLink5 && checkLink5[1] !== "") allLinks.push(checkLink5[1]);
        if (checkLink6 && checkLink6[1] !== "") allLinks.push(checkLink6[1]);
        if (checkLink7 && checkLink7[1] !== "") allLinks.push(checkLink7[1]);
        if (checkLink8 && checkLink8[1] !== "") allLinks.push(checkLink8[1]);
        if (checkLink9 && checkLink9[1] !== "") allLinks.push(checkLink9[1]);

        // 3. Phân loại và Ưu tiên chọn Link xịn nhất
        // Ưu tiên 1: Link trực tiếp .m3u8 (Native Stream) để App Play sướng nhất
        for (var i = 0; i < allLinks.length; i++) {
            if (allLinks[i].indexOf('.m3u8') > -1) {
                videoUrl = allLinks[i];
                break;
            }
        }

        // Ưu tiên 2: Nếu không có m3u8, đành xài Iframe nhúng web của họ
        if (videoUrl === "" && allLinks.length > 0) {
            videoUrl = allLinks[0]; // Lấy tạm link đầu tiên nếu xui xẻo
            for (var i = 0; i < allLinks.length; i++) {
                // Tránh lấy link short.icu hoặc link rác
                if (allLinks[i].indexOf('avcaption.com') > -1 || allLinks[i].indexOf('dailymotion.com') > -1) {
                    videoUrl = allLinks[i];
                    break;
                }
            }
        }

        return JSON.stringify({
            url: videoUrl,
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://yanhh3d.sh/", 
                "Origin": "https://yanhh3d.sh/" 
            },
            subtitles: []
        });
    } catch (error) { 
        return JSON.stringify({ url: "", headers: {}, subtitles: [] }); 
    }
}
