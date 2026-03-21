

export function setCookie(cookie_name, cookie_value, timeout_days) {
    const date = new Date();
    date.setTime(date.getTime() + (timeout_days * 24 * 60 * 60 * 1000));
    let expires = `expires=${date.toUTCString()}`;
    document.cookie = `${cookie_name}=${cookie_value}; ${expires}; SameSite=None; path=/; Secure`
}

export function getCookie(cookie_name) {
    const cookie = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${cookie_name}=`))

    if (cookie !== undefined) {
        return cookie.split("=")[1];
    }
    return ""
}

export function deleteCookie(cookie_name) {
    document.cookie = `${cookie_name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

export function assetNameProcess(raw_name) {
    if (!raw_name) {
        console.log("String is NULL")
        return
    }

    if (raw_name.length == 0) {
        console.log("String is empty")
        return
    }

    let item_name = raw_name.toLowerCase()
    item_name = item_name.replaceAll(" / ", "_")
    item_name = item_name.replaceAll("/", "_")
    item_name = item_name.replaceAll(" ", "_")
    item_name = item_name.trim()

    console.log(item_name)
    
    return item_name
}