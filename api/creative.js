const CREATIVE_URLS = {
  A2: "https://scontent-fra5-1.xx.fbcdn.net/v/t45.1600-4/756302252_2467402500413880_4502777857458338463_n.jpg?stp=dst-jpg_p720x720_sh2.08_spS444_tt6&_nc_cat=110&ccb=1-7&_nc_sid=f0a831&_nc_ohc=-nH112Tkcj8Q7kNvwGXv4bO&_nc_oc=AdogBIK4iy8PAEV8y8U23AIKX_nbAPksO_AZmUuCeUmE54ClK2J2CeuYpr57rOAiND0&_nc_zt=1&_nc_ht=scontent-fra5-1.xx&edm=APCh5TUEAAAA&_nc_gid=P1xVHNFwEYtu0LchQgvdmw&_nc_tpa=Q5bMBQL25lShMYk-nVkUXjzR5W5qdWuDheQKdqoPcAkVWFKeoiie1cYpAGP9VfeUt7g1nl6oj9gD1gG2lQ&oh=00_AQLo0G5dEgQNNpXPTULLC9iybnluCTKwsaaM-pxfISJ_PA&oe=6AA47F5E",
  A3: "https://scontent-fra3-1.xx.fbcdn.net/v/t45.1600-4/758769260_2467399803747483_7558440973242302268_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=d5bd00&_nc_ohc=I6xcpku3HkoQ7kNvwFrCmOz&_nc_oc=Ado-Xj9IRAPqFeqrKXmNiMFvJ9vTaJJ1qMrI-04Y726SaNyFC9koc0ZtGBW3yRVbcOM&_nc_zt=1&_nc_ht=scontent-fra3-1.xx&edm=AEuWsiQEAAAA&_nc_gid=m_Bm2Au9foW8jDtU5uMBRg&_nc_tpa=Q5bMBQIcsla9UXDsy8Xis8lxhN7DQpDWzWvu8JPVhk2tk6wZ9x7x_ErnKBU388kFmJgHpZTrbolwXITDIA&oh=00_AQLWI3_1sbaARTM5ohr9EWkwRmVEO6FTNXpUveF2Zmj3nA&oe=6AA493F5",
  A6: "https://scontent-fra5-1.xx.fbcdn.net/v/t45.1600-4/771001348_2480393682448095_310068713532921301_n.jpg?stp=dst-jpg_s720x720_sh2.08_spS444_tt6&_nc_cat=100&ccb=1-7&_nc_sid=f0a831&_nc_ohc=2U8yQuLBZk0Q7kNvwEb6kt-&_nc_oc=AdojcOxgAH-2BVR9A67RBekwA4VloA4ttIwysX-qUNTGqkIDdgD8xI5Ry7oKYGrkSQk&_nc_zt=1&_nc_ht=scontent-fra5-1.xx&edm=APCh5TUEAAAA&_nc_gid=xN2wBPFGtmgvJDfTOziQtA&_nc_tpa=Q5bMBQKAdxISbo9nUKWqg7ZgJFOBS9pKv57VfJ2Cd6VUZpDpUOoGPynK1nBqvjKsmlwC9zIsX9guOEwHxQ&oh=00_AQIfyRTq0uY9aEU2IO5UYawBFv9YzOifIID4qGnSHQ9k9A&oe=6AA487F6",
  A7: "https://scontent-fra3-1.xx.fbcdn.net/v/t45.1600-4/760527350_2472959333191530_5619511063735950638_n.jpg?_nc_cat=103&ccb=1-7&_nc_sid=d5bd00&_nc_ohc=MJsMAtDcXzcQ7kNvwGpXz1f&_nc_oc=AdqqpFLTK23g98OC0_sylqg3HQlsgsPe6Cp8yxmqM3P5IZktkoPOMWpAFcwz316TnGM&_nc_zt=1&_nc_ht=scontent-fra3-1.xx&edm=AEuWsiQEAAAA&_nc_gid=m_Bm2Au9foW8jDtU5uMBRg&_nc_tpa=Q5bMBQLSev8V018unehDasKVTJQCLbmVXATy52jAq3FF4PexMdEhdV2Ai5BlKoAtp_hxMxnRPhdElLrpTw&oh=00_AQK7TTjKR1aSv512-PGA256CUz0oz5Lu-rTBlKpmhryfzA&oe=6AA472BC",
  A8: "https://scontent-fra5-2.cdninstagram.com/v/t51.71878-15/791659834_1458606629464492_7019723484278858341_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=109&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQUQuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=mZld8N_eloUQ7kNvwEhP3j0&_nc_oc=Adreticgq1_ua7aVkpRyme6ucXhlbnErc83Kq3-d1aU7dUs5RcYoFygr9YjmZxRNVVI&_nc_zt=23&_nc_ht=scontent-fra5-2.cdninstagram.com&edm=AIZKd-4EAAAA&_nc_gid=qxtZd4OTMs2N5eyHMK0T1w&_nc_tpa=Q5bMBQIy673bKzcPE8tg2rTqrLeVYyJI9HMPu3lINCNgoVC-haZ8n8F8z6sC7mks0USFcUyU56KM4TXCXg&oh=00_AQJ-Ft9rUH-OJMscFq4w6genq-R4ICgL1yZIkSthwoNzRQ&oe=6AA495FB"
};

export default async function handler(req, res) {
  const id = String(req.query.id || "").toUpperCase();
  const url = CREATIVE_URLS[id];
  if (!url) return res.status(404).json({ error: "creative_not_found" });
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return res.status(r.status).json({ error: "upstream", status: r.status });
    const contentType = r.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await r.arrayBuffer());
    return res.status(200).json({ id, contentType, base64: buf.toString("base64") });
  } catch (error) {
    return res.status(500).json({ error: "fetch_failed", message: error?.message || String(error) });
  }
}
