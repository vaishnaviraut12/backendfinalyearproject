import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import marketplace from "./Marketplace.json";
import "./App.css";
import Sidebar from "./components/Sidebar";

// 1. Define your API at the very top (outside the component)
const API = process.env.REACT_APP_API_URL || "https://backendfinalyearproject.onrender.com";

// 2. Inside your App component, update your connection logic:
const loadBlockchainData = async () => {
  try {
    // Check if MetaMask is installed
    if (window.ethereum) {
      // ✅ Use MetaMask as the provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      // Initialize your contract with the signer
      // const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      console.log("Connected to MetaMask:", userAddress);
    } else {
      // ❌ Fallback if no MetaMask is found
      console.log("MetaMask not found. Please install it.");
      
      // ONLY use localhost if you are actually working on your computer
      if (window.location.hostname === "localhost") {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      }
    }
  } catch (error) {
    console.error("Connection error:", error);
  }
};
const PINATA_JWT = process.env.REACT_APP_PINATA_JWT;
/* ================= TOAST ================= */
const Toast = ({ toasts, removeToast }) => (
  <div style={{ position:"fixed", bottom:"30px", right:"30px", zIndex:9999, display:"flex", flexDirection:"column", gap:"12px" }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: t.type==="Sold"?"rgba(239,68,68,0.95)":t.type==="Purchased"?"rgba(0,246,255,0.95)":t.type==="Minted"?"rgba(123,97,255,0.95)":"rgba(30,41,59,0.97)",
        color:"#fff", padding:"14px 20px", borderRadius:"14px",
        boxShadow:"0 8px 32px rgba(0,0,0,0.4)", minWidth:"300px", maxWidth:"380px",
        display:"flex", alignItems:"flex-start", gap:"12px",
        animation:"slideIn 0.3s ease", backdropFilter:"blur(10px)",
        border:"1px solid rgba(255,255,255,0.1)"
      }}>
        <span style={{ fontSize:"1.4rem", lineHeight:1 }}>
          {t.type==="Sold"?"💸":t.type==="Purchased"?"🛒":t.type==="Minted"?"🎨":"🔔"}
        </span>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:"bold", margin:"0 0 3px", fontSize:"0.9rem" }}>{t.type}</p>
          <p style={{ margin:0, fontSize:"0.82rem", opacity:0.9, lineHeight:1.4 }}>{t.message}</p>
          {t.price && <p style={{ margin:"4px 0 0", fontSize:"0.8rem", fontWeight:"bold", opacity:0.9 }}>{t.price} ETH</p>}
        </div>
        <button onClick={() => removeToast(t.id)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.7)", cursor:"pointer", fontSize:"1.1rem", lineHeight:1, padding:0 }}>✕</button>
      </div>
    ))}
  </div>
);


/* ================= IN-APP MODAL (replaces alert/confirm) ================= */
const Modal = ({ modal, onClose, onConfirm }) => {
  if (!modal) return null;
  const isConfirm = modal.type === "confirm";
  const icon = modal.icon || (modal.variant === "error" ? "❌" : modal.variant === "success" ? "✅" : modal.variant === "warning" ? "⚠️" : "ℹ️");
  const color = modal.variant === "error" ? "#f04f47" : modal.variant === "success" ? "#00c896" : modal.variant === "warning" ? "#f0b429" : "#00e5ff";

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(12px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9998, padding:"20px" }}
      onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"#111520", border:`1px solid ${color}30`, borderRadius:"20px", padding:"36px 32px", maxWidth:"420px", width:"100%", boxShadow:`0 20px 60px rgba(0,0,0,0.6), 0 0 30px ${color}20`, animation:"fadeUp 0.25s ease", position:"relative", overflow:"hidden" }}>
        {/* top accent line */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:"2px", background:`linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <div style={{ textAlign:"center", marginBottom:"20px" }}>
          <div style={{ fontSize:"2.8rem", marginBottom:"12px", lineHeight:1 }}>{icon}</div>
          {modal.title && <h3 style={{ fontSize:"18px", fontWeight:"700", color:"#f0f3fa", marginBottom:"8px", fontFamily:"'Playfair Display',serif" }}>{modal.title}</h3>}
          <p style={{ color:"#8892a4", fontSize:"14px", lineHeight:1.6 }}>{modal.message}</p>
        </div>
        <div style={{ display:"flex", gap:"10px", justifyContent:"center" }}>
          {isConfirm && (
            <button onClick={onClose} style={{ flex:1, padding:"11px", borderRadius:"10px", border:"1px solid rgba(255,255,255,0.1)", background:"transparent", color:"#8892a4", fontWeight:"600", fontSize:"14px", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
              Cancel
            </button>
          )}
          <button
            onClick={() => { if(onConfirm) onConfirm(); onClose(); }}
            style={{ flex:1, padding:"11px", borderRadius:"10px", border:"none", background:`linear-gradient(135deg,${color},${color}bb)`, color: modal.variant==="warning"||modal.variant==="success" ? "#000" : "#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}
          >
            {isConfirm ? (modal.confirmText || "Confirm") : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= NOTIFICATION BELL ================= */
const NotificationBell = ({ notifications, unreadCount, onMarkRead, onClear }) => {
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => { setOpen(o => !o); if (!open && unreadCount > 0) onMarkRead(); };
  const iconColor = (type) => type==="Sold"?"#ef4444":type==="Purchased"?"#00f6ff":type==="Minted"?"#7B61FF":"#94a3b8";
  const iconEmoji = (type) => type==="Sold"?"💸":type==="Purchased"?"🛒":type==="Minted"?"🎨":"🔔";
  return (
    <div style={{ position:"relative" }}>
      <button onClick={handleOpen} style={{ position:"relative", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", padding:"8px 12px", cursor:"pointer", color:"#e2e8f0", fontSize:"1.2rem" }}>
        🔔
        {unreadCount > 0 && <span style={{ position:"absolute", top:"-6px", right:"-6px", background:"#ef4444", color:"#fff", borderRadius:"50%", width:"20px", height:"20px", fontSize:"0.7rem", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"bold" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>
      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 10px)", right:0, width:"360px", maxHeight:"480px", overflowY:"auto", background:"#0f172a", border:"1px solid rgba(0,246,255,0.15)", borderRadius:"16px", boxShadow:"0 20px 60px rgba(0,0,0,0.5)", zIndex:1000 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 18px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
            <h3 style={{ margin:0, color:"#e2e8f0", fontSize:"1rem" }}>Notifications</h3>
            {notifications.length > 0 && <button onClick={onClear} style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", fontSize:"0.78rem" }}>Clear all</button>}
          </div>
          {notifications.length === 0 ? (
            <div style={{ padding:"30px", textAlign:"center", color:"#64748b" }}><p style={{ fontSize:"2rem", margin:"0 0 8px" }}>🔕</p><p style={{ margin:0 }}>No notifications yet</p></div>
          ) : notifications.map((n, i) => (
            <div key={i} style={{ padding:"14px 18px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:n.read?"transparent":"rgba(123,97,255,0.05)", display:"flex", gap:"12px", alignItems:"flex-start" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:`${iconColor(n.type)}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>{iconEmoji(n.type)}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"3px" }}>
                  <span style={{ color:iconColor(n.type), fontSize:"0.78rem", fontWeight:"bold" }}>{n.type}</span>
                  {!n.read && <span style={{ width:7, height:7, borderRadius:"50%", background:"#7B61FF", display:"inline-block" }} />}
                </div>
                <p style={{ margin:"0 0 3px", color:"#e2e8f0", fontSize:"0.83rem", lineHeight:1.4 }}>{n.message}</p>
                {n.price && <p style={{ margin:"0 0 3px", color:"#00f6ff", fontSize:"0.8rem", fontWeight:"bold" }}>{n.price} ETH</p>}
                <p style={{ margin:0, color:"#475569", fontSize:"0.74rem" }}>{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ================= PUBLIC PROFILE VIEW ================= */
const PublicProfileView = ({ wallet, onBack, API, currentWallet }) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("all");
  React.useEffect(() => {
    if (!wallet) return;
    setLoading(true);
    axios.get(`${API}/api/public/profile/${wallet.toLowerCase()}`).then(res => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, [wallet]);
  if (loading) return <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"300px" }}><div style={{ color:"#94a3b8", fontSize:"1.1rem" }}>⏳ Loading profile...</div></div>;
  if (!data) return (
    <div style={{ textAlign:"center", padding:"60px", color:"#94a3b8" }}>
      <p style={{ fontSize:"3rem" }}>👤</p><h2>Profile not found</h2><p>This wallet hasn't set up a profile yet.</p>
      <button onClick={onBack} className="close-btn">← Go Back</button>
    </div>
  );
  const { profile, stats, nfts } = data;
  const isOwnProfile = currentWallet && currentWallet.toLowerCase() === wallet.toLowerCase();
  const displayNFTs = tab==="minted" ? nfts.filter(n => n.seller?.toLowerCase()===wallet.toLowerCase()) : tab==="collected" ? nfts.filter(n => n.seller?.toLowerCase()!==wallet.toLowerCase()) : nfts;
  const statBox = (label, value, color="#00f6ff") => (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"12px", padding:"18px 24px", textAlign:"center", flex:1, minWidth:"100px" }}>
      <p style={{ margin:"0 0 6px", color:"#64748b", fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.05em" }}>{label}</p>
      <p style={{ margin:0, color, fontSize:"1.6rem", fontWeight:"bold" }}>{value}</p>
    </div>
  );
  return (
    <div className="animate" style={{ maxWidth:"1100px", margin:"0 auto" }}>
      <button className="close-btn" onClick={onBack} style={{ margin:"20px 20px 0" }}>← Back</button>
      <div style={{ position:"relative", height:"220px", overflow:"hidden" }}>
        {profile.banner ? <img src={profile.banner} alt="banner" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#1e1b4b 0%,#0f172a 50%,#1e293b 100%)" }} />}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to top, rgba(15,23,42,1) 0%, transparent 60%)" }} />
      </div>
      <div style={{ padding:"0 40px 20px", marginTop:"-50px", position:"relative" }}>
        <div style={{ display:"flex", gap:"24px", alignItems:"flex-end", flexWrap:"wrap" }}>
          <div style={{ width:100, height:100, borderRadius:"50%", border:"4px solid #0f172a", overflow:"hidden", flexShrink:0, background:"#1e293b" }}>
            {profile.avatar ? <img src={profile.avatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.5rem" }}>👤</div>}
          </div>
          <div style={{ flex:1, paddingBottom:"8px" }}>
            <h2 style={{ margin:"0 0 6px", fontSize:"1.6rem", color:"#f1f5f9" }}>{profile.username || "Anonymous"}{isOwnProfile && <span style={{ marginLeft:"10px", fontSize:"0.72rem", color:"#7B61FF", background:"rgba(123,97,255,0.15)", padding:"3px 10px", borderRadius:"20px" }}>You</span>}</h2>
            <p style={{ margin:"0 0 8px", fontFamily:"monospace", fontSize:"0.82rem", color:"#64748b" }}>{wallet.slice(0,8)}...{wallet.slice(-6)}<span onClick={() => navigator.clipboard.writeText(wallet)} title="Copy" style={{ marginLeft:"8px", cursor:"pointer", color:"#7B61FF", fontSize:"0.75rem" }}>📋 Copy</span></p>
            {profile.bio && <p style={{ margin:"0 0 10px", color:"#94a3b8", fontSize:"0.9rem", lineHeight:1.5 }}>{profile.bio}</p>}
            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
              {profile.twitter && <a href={`https://twitter.com/${profile.twitter.replace("@","")}`} target="_blank" rel="noreferrer" style={{ color:"#1d9bf0", fontSize:"0.82rem", textDecoration:"none" }}>🐦 Twitter</a>}
              {profile.instagram && <a href={`https://instagram.com/${profile.instagram.replace("@","")}`} target="_blank" rel="noreferrer" style={{ color:"#e1306c", fontSize:"0.82rem", textDecoration:"none" }}>📸 Instagram</a>}
              {profile.discord && <span style={{ color:"#7289da", fontSize:"0.82rem" }}>💬 {profile.discord}</span>}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:"12px", marginTop:"24px", flexWrap:"wrap" }}>
          {statBox("Total NFTs", stats.totalNFTs)}{statBox("Minted", stats.minted, "#7B61FF")}{statBox("Collected", stats.purchased, "#00f6ff")}{statBox("Volume", `${stats.totalVolume} ETH`, "#f59e0b")}
        </div>
        <div style={{ display:"flex", gap:"8px", marginTop:"30px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          {[["all","All NFTs"],["minted","Minted"],["collected","Collected"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ background:"none", border:"none", cursor:"pointer", color:tab===key?"#00f6ff":"#64748b", borderBottom:tab===key?"2px solid #00f6ff":"2px solid transparent", padding:"10px 18px", fontSize:"0.9rem", fontWeight:tab===key?"600":"400", marginBottom:"-1px", transition:"all 0.2s" }}>
              {label} <span style={{ color:"#475569", fontSize:"0.78rem" }}>({key==="all"?nfts.length:key==="minted"?stats.minted:stats.purchased})</span>
            </button>
          ))}
        </div>
        <div style={{ marginTop:"24px" }}>
          {displayNFTs.length === 0 ? (
            <div style={{ textAlign:"center", padding:"50px", color:"#64748b" }}><p style={{ fontSize:"2rem" }}>🖼️</p><p>No NFTs in this category yet.</p></div>
          ) : (
            <div className="grid">
              {displayNFTs.map((nft, i) => (
                <div key={i} className="nft-card">
                  <img src={nft.image} alt={nft.name} style={{ width:"100%", borderRadius:"12px 12px 0 0" }} />
                  <div style={{ padding:"12px" }}>
                    <h3 style={{ margin:"0 0 5px", fontSize:"0.95rem" }}>{nft.name}</h3>
                    <p style={{ margin:"0 0 6px", color:"#00f6ff", fontWeight:"bold", fontSize:"0.88rem" }}>{nft.price} ETH</p>
                    <span style={{ fontSize:"0.72rem", color:"#7B61FF", background:"rgba(123,97,255,0.15)", padding:"2px 8px", borderRadius:"20px" }}>{nft.category}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ================= USER SEARCH BAR ================= */
const UserSearchBar = ({ API, onSelectWallet }) => {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      axios.get(`${API}/api/public/search?q=${encodeURIComponent(query)}`).then(res => { setResults(res.data); setShow(true); }).catch(() => setResults([]));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);
  return (
    <div style={{ position:"relative", width:"100%" }}>
      <input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => results.length > 0 && setShow(true)} onBlur={() => setTimeout(() => setShow(false), 200)} placeholder="🔍 Search users by name or wallet..." style={{ width:"100%", padding:"10px 16px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"10px", color:"#e2e8f0", fontSize:"0.9rem", outline:"none", boxSizing:"border-box" }} />
      {show && results.length > 0 && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:"#0f172a", border:"1px solid rgba(0,246,255,0.15)", borderRadius:"12px", zIndex:500, overflow:"hidden", boxShadow:"0 10px 40px rgba(0,0,0,0.4)" }}>
          {results.map((p, i) => (
            <div key={i} onMouseDown={() => { onSelectWallet(p.wallet); setQuery(""); setShow(false); }} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 16px", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.04)", transition:"background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background="rgba(123,97,255,0.1)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <div style={{ width:38, height:38, borderRadius:"50%", background:"#1e293b", overflow:"hidden", flexShrink:0 }}>
                {p.avatar ? <img src={p.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>👤</div>}
              </div>
              <div>
                <p style={{ margin:"0 0 2px", color:"#e2e8f0", fontWeight:"600", fontSize:"0.88rem" }}>{p.username || "Anonymous"}</p>
                <p style={{ margin:0, color:"#64748b", fontFamily:"monospace", fontSize:"0.75rem" }}>{p.wallet ? `${p.wallet.slice(0,8)}...${p.wallet.slice(-6)}` : "No wallet"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ================= NFT DETAIL VIEW ================= */
const NFTDetailView = ({ nft, wallet, authUser, onBack, onBuy, onUnlist, API }) => {
  const [history, setHistory] = React.useState([]);
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  React.useEffect(() => {
    if (!nft) return;
    setLoadingHistory(true);
    axios.get(`${API}/api/history/${nft.tokenId}`).then(res => setHistory(res.data)).catch(() => setHistory([])).finally(() => setLoadingHistory(false));
  }, [nft]);
  if (!nft) return null;
  const isOwner = wallet && nft.seller && wallet.toLowerCase() === nft.seller.toLowerCase();
  const chartPoints = history.map((h, i) => ({ index:i, price:parseFloat(h.price), event:h.event, date:new Date(h.createdAt).toLocaleDateString() }));
  const maxPrice = Math.max(...chartPoints.map(p => p.price), 0.001);
  const minPrice = Math.min(...chartPoints.map(p => p.price), 0);
  const chartW=600, chartH=180, padL=50, padR=20, padT=20, padB=40;
  const innerW=chartW-padL-padR, innerH=chartH-padT-padB;
  const toX = (i) => chartPoints.length < 2 ? padL+innerW/2 : padL+(i/(chartPoints.length-1))*innerW;
  const toY = (price) => maxPrice===minPrice ? padT+innerH/2 : padT+innerH-((price-minPrice)/(maxPrice-minPrice))*innerH;
  const polyline = chartPoints.map((p,i) => `${toX(i)},${toY(p.price)}`).join(" ");
  const areaPath = chartPoints.length > 0 ? `M${toX(0)},${toY(chartPoints[0].price)} `+chartPoints.map((p,i) => `L${toX(i)},${toY(p.price)}`).join(" ")+` L${toX(chartPoints.length-1)},${padT+innerH} L${toX(0)},${padT+innerH} Z` : "";
  const eventColor = (e) => e==="Minted"?"#7B61FF":e==="Sale"?"#00f6ff":"#ef4444";
  return (
    <div className="collection-page animate">
      <button className="close-btn" onClick={onBack}>Back to Marketplace</button>
      <div style={{ display:"flex", gap:"40px", padding:"40px", justifyContent:"center", flexWrap:"wrap" }}>
        <img src={nft.image} alt={nft.name} style={{ width:"380px", borderRadius:"20px", boxShadow:"0 0 30px rgba(0,246,255,0.2)", objectFit:"cover" }} />
        <div style={{ textAlign:"left", maxWidth:"480px", flex:1 }}>
          <span style={{ fontSize:"0.78rem", color:"#7B61FF", background:"rgba(123,97,255,0.15)", padding:"4px 12px", borderRadius:"20px" }}>{nft.category}</span>
          <h1 style={{ margin:"15px 0 10px" }}>{nft.name}</h1>
          <p style={{ color:"#94a3b8", marginBottom:"25px", lineHeight:1.6 }}>{nft.description}</p>
          <div style={{ background:"rgba(0,229,255,0.05)", border:"1px solid rgba(0,229,255,0.18)", borderRadius:"12px", padding:"18px 22px", marginBottom:"20px" }}>
            <p style={{ color:"#8892a4", fontSize:"0.8rem", marginBottom:"5px" }}>Current Price</p>
            <p style={{ fontSize:"2rem", fontWeight:"800", color:"#00e5ff", fontFamily:"'JetBrains Mono',monospace" }}>
              {nft.price
                ? (() => { try { return ethers.formatEther(nft.price) + " ETH"; } catch { return nft.price + " ETH"; } })()
                : "—"}
            </p>
          </div>
          <div style={{ display:"flex", gap:"10px" }}>
            {isOwner ? (
              <button onClick={() => { onUnlist(nft.tokenId); onBack(); }} className="btn-danger" style={{ padding:"12px 30px" }}>🗑 Remove Listing</button>
            ) : wallet ? (
              <button onClick={() => { onBuy(nft.tokenId, nft.price); onBack(); }} style={{ background:"linear-gradient(135deg,#7B61FF,#00f6ff)", padding:"12px 30px", borderRadius:"10px", border:"none", color:"white", fontWeight:"bold", cursor:"pointer" }}>Buy Now</button>
            ) : (
              <p style={{ color:"#94a3b8" }}>Connect wallet to buy</p>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding:"0 40px 40px" }}>
        <h2 style={{ marginBottom:"20px", color:"#00f6ff" }}>Price History</h2>
        {loadingHistory ? <p style={{ color:"#94a3b8" }}>Loading history...</p> : history.length === 0 ? <p style={{ color:"#94a3b8" }}>No price history yet.</p> : (
          <>
            <div style={{ background:"rgba(15,23,42,0.8)", borderRadius:"16px", padding:"20px", marginBottom:"25px", border:"1px solid rgba(0,246,255,0.1)", overflowX:"auto" }}>
              <svg width={chartW} height={chartH} style={{ display:"block", margin:"0 auto" }}>
                {[0,0.25,0.5,0.75,1].map((t,i) => { const y=padT+t*innerH; const val=maxPrice-t*(maxPrice-minPrice); return (<g key={i}><line x1={padL} y1={y} x2={padL+innerW} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" /><text x={padL-6} y={y+4} fill="#64748b" fontSize="10" textAnchor="end">{val.toFixed(3)}</text></g>); })}
                {areaPath && <path d={areaPath} fill="rgba(0,246,255,0.06)" />}
                {chartPoints.length > 1 && <polyline points={polyline} fill="none" stroke="#00f6ff" strokeWidth="2.5" strokeLinejoin="round" />}
                {chartPoints.map((p,i) => (<g key={i}><circle cx={toX(i)} cy={toY(p.price)} r="5" fill={eventColor(p.event)} stroke="#0f172a" strokeWidth="2" /><text x={toX(i)} y={padT+innerH+18} fill="#64748b" fontSize="9" textAnchor="middle">{p.date}</text></g>))}
                <line x1={padL} y1={padT} x2={padL} y2={padT+innerH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              </svg>
              <div style={{ display:"flex", gap:"20px", justifyContent:"center", marginTop:"10px" }}>
                {["Minted","Sale","Unlisted"].map(e => (<div key={e} style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"0.75rem", color:"#94a3b8" }}><div style={{ width:10, height:10, borderRadius:"50%", background:eventColor(e) }} />{e}</div>))}
              </div>
            </div>
            <div style={{ background:"rgba(15,23,42,0.8)", borderRadius:"16px", overflow:"hidden", border:"1px solid rgba(0,246,255,0.1)" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead><tr style={{ background:"rgba(0,246,255,0.05)" }}>{["Event","Price","From","To","Date"].map(h => <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#94a3b8", fontSize:"0.8rem" }}>{h}</th>)}</tr></thead>
                <tbody>
                  {[...history].reverse().map((h,i) => (
                    <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding:"12px 16px" }}><span style={{ background:`${eventColor(h.event)}22`, color:eventColor(h.event), padding:"3px 10px", borderRadius:"20px", fontSize:"0.78rem" }}>{h.event}</span></td>
                      <td style={{ padding:"12px 16px", color:"#00f6ff", fontWeight:"bold" }}>{h.price} ETH</td>
                      <td style={{ padding:"12px 16px", fontFamily:"monospace", fontSize:"0.78rem", color:"#94a3b8" }}>{h.from ? `${h.from.slice(0,6)}...${h.from.slice(-4)}` : "—"}</td>
                      <td style={{ padding:"12px 16px", fontFamily:"monospace", fontSize:"0.78rem", color:"#94a3b8" }}>{h.to ? `${h.to.slice(0,6)}...${h.to.slice(-4)}` : "—"}</td>
                      <td style={{ padding:"12px 16px", color:"#64748b", fontSize:"0.78rem" }}>{new Date(h.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


/* ================= DROP VIEW ================= */
const DropView = ({ onAlert }) => {
  const [address, setAddress] = React.useState("");
  const [checked, setChecked] = React.useState(null);
  const [timeLeft, setTimeLeft] = React.useState({ d:2, h:14, m:20, s:0 });

  React.useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        let { d,h,m,s } = prev;
        s--; if(s<0){s=59;m--;} if(m<0){m=59;h--;} if(h<0){h=23;d--;}
        return { d:Math.max(0,d), h:Math.max(0,h), m:Math.max(0,m), s:Math.max(0,s) };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = n => String(n).padStart(2,"0");

  return (
    <div className="page-section animate">
      <h2>🎁 NFT Drops</h2>
      <p style={{ color:"#94a3b8", fontSize:"14px", marginBottom:"28px" }}>Upcoming exclusive NFT drops. Get on the allowlist early.</p>

      {/* COUNTDOWN */}
      <div style={{ background:"rgba(123,97,255,0.08)", border:"1px solid rgba(123,97,255,0.3)", borderRadius:"20px", padding:"32px", maxWidth:"500px", marginBottom:"32px", textAlign:"center" }}>
        <span style={{ fontSize:"11px", color:"#7B61FF", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em" }}>Next Drop Starts In</span>
        <div style={{ display:"flex", gap:"16px", justifyContent:"center", marginTop:"16px" }}>
          {[["Days",timeLeft.d],["Hours",timeLeft.h],["Mins",timeLeft.m],["Secs",timeLeft.s]].map(([label,val]) => (
            <div key={label} style={{ background:"rgba(0,0,0,0.3)", borderRadius:"12px", padding:"14px 18px", minWidth:"70px" }}>
              <p style={{ margin:0, fontSize:"28px", fontWeight:"700", color:"#00f6ff", fontFamily:"monospace" }}>{pad(val)}</p>
              <p style={{ margin:"4px 0 0", fontSize:"11px", color:"#64748b", textTransform:"uppercase" }}>{label}</p>
            </div>
          ))}
        </div>
        <p style={{ marginTop:"20px", color:"#94a3b8", fontSize:"13px" }}>Genesis Warriors Collection — 500 unique pixel warriors</p>
      </div>

      {/* ALLOWLIST CHECK */}
      <div className="drop-box" style={{ maxWidth:"480px" }}>
        <h3 style={{ marginBottom:"8px", fontSize:"16px" }}>🔍 Check Allowlist</h3>
        <p style={{ color:"#94a3b8", fontSize:"13px", marginBottom:"16px" }}>Enter your wallet address to check if you're on the allowlist.</p>
        <input
          placeholder="0x... your wallet address"
          value={address}
          onChange={e => { setAddress(e.target.value); setChecked(null); }}
          style={{ marginBottom:"12px" }}
        />
        <button
          onClick={() => {
            if (!address || address.length < 10) { if(onAlert) onAlert("Please enter a valid wallet address.", "warning", "Invalid Address", "🔍"); return; }
            setChecked(address.toLowerCase().endsWith("a") || address.toLowerCase().endsWith("f"));
          }}
          style={{ width:"100%", padding:"12px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#7B61FF,#00f6ff)", color:"#fff", fontWeight:"700", cursor:"pointer", fontSize:"14px" }}
        >
          Check Allowlist
        </button>
        {checked !== null && (
          <div style={{ marginTop:"14px", padding:"14px", borderRadius:"12px", background: checked ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${checked ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, textAlign:"center" }}>
            <p style={{ margin:0, color: checked ? "#10b981" : "#ef4444", fontWeight:"700", fontSize:"15px" }}>
              {checked ? "✅ You're on the allowlist!" : "❌ Not on the allowlist yet"}
            </p>
            <p style={{ margin:"6px 0 0", color:"#94a3b8", fontSize:"12px" }}>
              {checked ? "You can mint when the drop goes live." : "Follow our socials to get early access."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= ACTIVITY VIEW ================= */
const ActivityView = ({ marketNFTs, savedNFTs, wallet, onSelectNFT }) => {
  const [activeTab, setActiveTab] = React.useState("all");
  const activities = [
    ...savedNFTs.map(n => ({ type:"Mint",    name:n.name, price:n.price,                      wallet:n.seller||"—", time:"Recent", image:n.image, nft:n })),
    ...marketNFTs.map(n =>  ({ type:"Listing", name:n.name, price:ethers.formatEther(n.price), wallet:n.seller||"—", time:"Active", image:n.image, nft:n })),
  ];
  const filtered = activeTab === "all" ? activities : activities.filter(a => a.type.toLowerCase() === activeTab);

  return (
    <div className="page-section animate">
      <h2>📊 Activity</h2>
      <p style={{ color:"#94a3b8", fontSize:"14px", marginBottom:"20px" }}>Recent marketplace activity — mints, listings and sales.</p>

      {/* TABS */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"20px", flexWrap:"wrap" }}>
        {["all","mint","listing","sale"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding:"7px 18px", borderRadius:"20px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:"600", background: activeTab===tab ? "rgba(0,246,255,0.15)" : "rgba(255,255,255,0.05)", color: activeTab===tab ? "#00f6ff" : "#94a3b8", outline: activeTab===tab ? "1px solid rgba(0,246,255,0.3)" : "none" }}>
            {tab.charAt(0).toUpperCase()+tab.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px", color:"#64748b" }}>
          <p style={{ fontSize:"2.5rem" }}>📭</p>
          <p style={{ marginTop:"12px" }}>No activity yet. Mint or buy an NFT to get started.</p>
        </div>
      ) : (
        <div style={{ background:"rgba(15,23,42,0.5)", borderRadius:"16px", overflow:"hidden", border:"1px solid rgba(255,255,255,0.06)" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"rgba(0,246,255,0.05)" }}>
                {["Event","Item","Price","Wallet","Status"].map(h => (
                  <th key={h} style={{ padding:"12px 16px", textAlign:"left", color:"#64748b", fontSize:"11px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.08em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => (
                <tr key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding:"14px 16px" }}>
                    <span style={{ background: a.type==="Mint"?"rgba(123,97,255,0.15)":a.type==="Sale"?"rgba(16,185,129,0.15)":"rgba(0,246,255,0.1)", color: a.type==="Mint"?"#7B61FF":a.type==="Sale"?"#10b981":"#00f6ff", padding:"3px 10px", borderRadius:"20px", fontSize:"12px", fontWeight:"700" }}>{a.type}</span>
                  </td>
                  <td style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"10px", cursor: a.nft ? "pointer" : "default" }}
                      onClick={() => a.nft && onSelectNFT && onSelectNFT(a.nft)}>
                      <img src={a.image} alt="" style={{ width:"36px", height:"36px", borderRadius:"8px", objectFit:"cover" }} />
                      <span style={{ color:"#e2e8f0", fontSize:"13px", fontWeight:"600" }}>{a.name}</span>
                    </div>
                  </td>
                  <td style={{ padding:"14px 16px", color:"#00f6ff", fontFamily:"monospace", fontWeight:"600", fontSize:"13px" }}>{a.price} ETH</td>
                  <td style={{ padding:"14px 16px", fontFamily:"monospace", fontSize:"12px", color:"#64748b" }}>{a.wallet ? `${a.wallet.slice(0,6)}...${a.wallet.slice(-4)}` : "—"}</td>
                  <td style={{ padding:"14px 16px" }}><span style={{ fontSize:"11px", color:"#10b981", fontWeight:"600" }}>{a.time}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* ================= HELP VIEW ================= */
const HelpView = () => {
  const [openFaq, setOpenFaq] = React.useState(null);
  const faqs = [
    { q:"How do I mint an NFT?", a:"Click 'Mint' in the navbar. Connect your MetaMask wallet, fill in the name, description, upload an image, set a price in ETH, then click 'Create Item'. MetaMask will ask you to confirm the transaction." },
    { q:"How do I buy an NFT?", a:"Go to Discover page, connect your MetaMask wallet, switch to a different account than the seller, then click the 'Buy' button on any NFT card. Confirm the transaction in MetaMask." },
    { q:"Why does my NFT show 'Remove Listing' instead of 'Buy'?", a:"This means your connected MetaMask wallet is the same address that listed the NFT. Switch to a different MetaMask account to see the Buy button." },
    { q:"What is the listing fee?", a:"There is a small listing fee of 0.01 ETH charged by the smart contract when you mint. This covers the gas cost of deploying the NFT on the blockchain." },
    { q:"How do I open a Lootbox?", a:"Go to Rewards in the sidebar. Click the gift box or 'Open Lootbox' button. A spinning reel will reveal your prize. You can then mint the won NFT to your wallet." },
    { q:"How does Dark/Light mode work?", a:"Click the ☀️/🌙 button in the top navbar. Your preference is saved automatically and will be remembered next time you visit." },
    { q:"How do I add Localhost 8545 to MetaMask?", a:"Open MetaMask → Settings → Networks → Add a network → RPC URL: http://127.0.0.1:8545 → Chain ID: 31337 → Symbol: ETH → Save." },
    { q:"Why are my NFTs gone after restarting Hardhat?", a:"Hardhat resets the blockchain on restart. You need to re-mint your NFTs each session. For permanent NFTs, deploy to Sepolia testnet or mainnet." },
  ];

  return (
    <div className="page-section animate">
      <h2>❓ Help Center</h2>
      <p style={{ color:"#94a3b8", fontSize:"14px", marginBottom:"32px" }}>Find answers to common questions below.</p>

      {/* FAQ ACCORDION */}
      <div style={{ maxWidth:"700px" }}>
        {faqs.map((faq, i) => (
          <div key={i} style={{ marginBottom:"10px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"14px", overflow:"hidden", transition:"all 0.2s" }}>
            <div
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{ padding:"16px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", userSelect:"none" }}
              onMouseEnter={e => e.currentTarget.parentElement.style.borderColor="rgba(123,97,255,0.4)"}
              onMouseLeave={e => e.currentTarget.parentElement.style.borderColor="rgba(255,255,255,0.07)"}
            >
              <span style={{ fontWeight:"600", fontSize:"14px", color:"#e2e8f0" }}>{faq.q}</span>
              <span style={{ color:"#7B61FF", fontSize:"18px", fontWeight:"700", transition:"transform 0.2s", transform: openFaq===i ? "rotate(45deg)" : "rotate(0)" }}>+</span>
            </div>
            {openFaq === i && (
              <div style={{ padding:"0 20px 18px", animation:"lootFadeUp 0.2s ease" }}>
                <p style={{ color:"#94a3b8", fontSize:"13.5px", lineHeight:1.7, margin:0 }}>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* CONTACT */}
      <div style={{ marginTop:"40px", padding:"28px", background:"rgba(0,246,255,0.04)", border:"1px solid rgba(0,246,255,0.15)", borderRadius:"20px", maxWidth:"700px" }}>
        <h3 style={{ fontSize:"16px", fontWeight:"700", marginBottom:"8px" }}>Still need help?</h3>
        <p style={{ color:"#64748b", fontSize:"13px", marginBottom:"16px" }}>Reach out and we'll get back to you.</p>
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          <button onClick={() => window.open("mailto:support@nftmarketplace.com")} style={{ padding:"10px 22px", borderRadius:"10px", border:"1px solid rgba(0,246,255,0.3)", background:"transparent", color:"#00f6ff", fontWeight:"600", fontSize:"13px", cursor:"pointer" }}>📧 Email Support</button>
          <button onClick={() => window.open("https://discord.gg","_blank")} style={{ padding:"10px 22px", borderRadius:"10px", border:"1px solid rgba(123,97,255,0.3)", background:"transparent", color:"#7B61FF", fontWeight:"600", fontSize:"13px", cursor:"pointer" }}>💬 Discord Community</button>
        </div>
      </div>
    </div>
  );
};


/* ================= STUDIO VIEW ================= */
const StudioView = ({ authUser, wallet, onAlert, onMint }) => {
  const [colName, setColName] = React.useState("");
  const [symbol, setSymbol] = React.useState("");
  const [royalty, setRoyalty] = React.useState("");

  function handleDeploy() {
    if (!authUser) return onAlert("Please login first.", "warning", "Login Required", "🔐");
    if (!wallet)   return onAlert("Connect your wallet to deploy a contract.", "warning", "Wallet Required", "🦊");
    if (!colName.trim()) return onAlert("Enter a collection name.", "warning", "Missing Name", "✏️");
    if (!symbol.trim())  return onAlert("Enter a collection symbol (e.g. MPW).", "warning", "Missing Symbol", "🏷️");
    onAlert(`"${colName}" (${symbol.toUpperCase()}) deployment will launch on Sepolia! Royalty: ${royalty||0}%. Stay tuned.`, "info", "Coming Soon 🚀", "🚀");
  }

  return (
    <div className="page-section animate">
      <h2>🛠 Creator Studio</h2>
      <p style={{ color:"#8892a4", fontSize:"14px", marginBottom:"24px" }}>Deploy your own ERC-721 collection and set royalties on every resale.</p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px", maxWidth:"700px" }}>
        <div className="studio-box" style={{ gridColumn:"1/-1" }}>
          <h3 style={{ fontSize:"15px", fontWeight:"700", marginBottom:"18px", color:"#f0f3fa" }}>📋 Collection Details</h3>
          <label style={{ fontSize:"11px", color:"#4a5568", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.09em", display:"block", marginBottom:"6px" }}>Collection Name *</label>
          <input value={colName} onChange={e=>setColName(e.target.value)} placeholder="e.g. My Pixel Warriors" style={{ marginBottom:"14px" }} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={{ fontSize:"11px", color:"#4a5568", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.09em", display:"block", marginBottom:"6px" }}>Symbol *</label>
              <input value={symbol} onChange={e=>setSymbol(e.target.value.toUpperCase())} placeholder="MPW" maxLength={5} style={{ marginBottom:"0" }} />
            </div>
            <div>
              <label style={{ fontSize:"11px", color:"#4a5568", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.09em", display:"block", marginBottom:"6px" }}>Royalty % (0–15)</label>
              <input value={royalty} onChange={e=>setRoyalty(e.target.value)} type="number" min="0" max="15" placeholder="5" style={{ marginBottom:"0" }} />
            </div>
          </div>
        </div>

        <div style={{ background:"rgba(0,229,255,0.04)", border:"1px solid rgba(0,229,255,0.15)", borderRadius:"14px", padding:"20px" }}>
          <h4 style={{ fontSize:"13px", fontWeight:"700", marginBottom:"12px", color:"#00e5ff" }}>📊 Preview</h4>
          <p style={{ fontSize:"13px", color:"#8892a4", marginBottom:"6px" }}>Name: <span style={{ color:"#f0f3fa" }}>{colName || "—"}</span></p>
          <p style={{ fontSize:"13px", color:"#8892a4", marginBottom:"6px" }}>Symbol: <span style={{ color:"#f0f3fa", fontFamily:"monospace" }}>{symbol || "—"}</span></p>
          <p style={{ fontSize:"13px", color:"#8892a4", marginBottom:"6px" }}>Royalty: <span style={{ color:"#f0b429" }}>{royalty || 0}%</span></p>
          <p style={{ fontSize:"13px", color:"#8892a4" }}>Network: <span style={{ color:"#8b5cf6" }}>Sepolia Testnet</span></p>
        </div>

        <div style={{ background:"rgba(139,92,246,0.06)", border:"1px solid rgba(139,92,246,0.2)", borderRadius:"14px", padding:"20px" }}>
          <h4 style={{ fontSize:"13px", fontWeight:"700", marginBottom:"12px", color:"#8b5cf6" }}>💡 Quick Mint</h4>
          <p style={{ fontSize:"13px", color:"#8892a4", marginBottom:"12px", lineHeight:1.6 }}>Want to mint a single NFT right now without deploying a full collection?</p>
          <button onClick={onMint} style={{ width:"100%", padding:"10px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#8b5cf6,#00e5ff)", color:"#fff", fontWeight:"700", fontSize:"13px", cursor:"pointer" }}>🎨 Go to Mint Page</button>
        </div>

        <button onClick={handleDeploy} style={{ gridColumn:"1/-1", padding:"14px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#00e5ff,#38bdf8)", color:"#04050a", fontWeight:"800", fontSize:"15px", cursor:"pointer", letterSpacing:"0.04em" }}>🚀 Deploy ERC-721 Collection</button>
      </div>
    </div>
  );
};

/* ================= LOOTBOX DATA — YOUR REAL NFT IMAGES ================= */
const LOOT_ITEMS = [
  // BRONZE — Uncommon (brown/tan themed)
  { id:"b1", name:"Bronze Warrior",     image:"/loot/Nft3.png",  rarity:"bronze", price:"0.03", desc:"A seasoned warrior with curly bronze locks.",      category:"Gaming" },
  { id:"b2", name:"Bronze Spirit",      image:"/loot/Nft4.png",  rarity:"bronze", price:"0.025",desc:"Cheerful spirit with flowing bronze hair.",         category:"Art"    },
  { id:"b3", name:"Bronze Guardian",    image:"/loot/Nft5.png",  rarity:"bronze", price:"0.028",desc:"Guardian of the bronze realm, always smiling.",     category:"Art"    },
  { id:"b4", name:"Bronze Elder",       image:"/loot/Nft14.png", rarity:"bronze", price:"0.035",desc:"Ancient elder bearing the bronze crest.",           category:"Gaming" },
  // SILVER — Common (blue/dark themed)
  { id:"s1", name:"Silver Knight",      image:"/loot/Nft12.png", rarity:"silver", price:"0.06", desc:"Knight of the silver order, battle-hardened.",      category:"Gaming" },
  { id:"s2", name:"Silver Phantom",     image:"/loot/Nft9.png",  rarity:"silver", price:"0.055",desc:"Phantom warrior with silver curls.",                category:"Art"    },
  { id:"s3", name:"Silver Specter",     image:"/loot/Nft13.png", rarity:"silver", price:"0.065",desc:"Pointed silver helm from the dark ages.",           category:"Gaming" },
  { id:"s4", name:"Silver Shield",      image:"/loot/Nft11.png", rarity:"silver", price:"0.07", desc:"Silver shield bearer of the north.",                category:"Gaming" },
  { id:"s5", name:"Silver Wanderer",    image:"/loot/Nft10.png", rarity:"silver", price:"0.058",desc:"Wanderer of the silver mist.",                      category:"Art"    },
  // GOLD — Rare (yellow/gold themed)
  { id:"g1", name:"Gold Helm",          image:"/loot/Nft1.png",  rarity:"gold",   price:"0.15", desc:"Legendary gold helm worn by ancient champions.",    category:"Gaming" },
  { id:"g2", name:"Gold Shield Bearer", image:"/loot/Nft2.png",  rarity:"gold",   price:"0.18", desc:"Bearer of the sacred golden shield.",               category:"Gaming" },
  { id:"g3", name:"Gold Sage",          image:"/loot/Nft14.png", rarity:"gold",   price:"0.20", desc:"Wise sage crowned in pure gold.",                   category:"Art"    },
  { id:"g4", name:"Gold Conqueror",     image:"/loot/Nft15.png", rarity:"gold",   price:"0.22", desc:"Conqueror's pointed gold helm, feared in battle.",  category:"Gaming" },
  // PURPLE — Legendary (purple/violet themed)
  { id:"p1", name:"Purple Champion",    image:"/loot/Nft7.png",  rarity:"purple", price:"0.5",  desc:"Champion of the purple realm. Extremely rare.",     category:"Gaming" },
  { id:"p2", name:"Purple Specter",     image:"/loot/Nft8.png",  rarity:"purple", price:"0.6",  desc:"Spectral purple helm from beyond the veil.",        category:"Gaming" },
  { id:"p3", name:"Purple Force",       image:"/loot/Nft6.png",  rarity:"purple", price:"0.55", desc:"The purple force shield — only 3 exist.",           category:"Gaming" },
  { id:"p4", name:"Purple Spirit",      image:"/loot/Nft10.png", rarity:"purple", price:"0.65", desc:"Spirit of the purple woods, mystical and rare.",    category:"Art"    },
];

const RARITY_CONFIG = {
  bronze: { label:"Bronze",  sublabel:"Uncommon", weight:40, bg:"rgba(180,120,60,0.15)",  color:"#cd7f32", border:"rgba(205,127,50,0.45)",  glow:"rgba(205,127,50,0.2)"  },
  silver: { label:"Silver",  sublabel:"Common",   weight:35, bg:"rgba(148,163,184,0.12)", color:"#94a3b8", border:"rgba(148,163,184,0.4)",  glow:"rgba(148,163,184,0.15)" },
  gold:   { label:"Gold",    sublabel:"Rare",      weight:18, bg:"rgba(245,158,11,0.15)",  color:"#f59e0b", border:"rgba(245,158,11,0.45)",  glow:"rgba(245,158,11,0.25)"  },
  purple: { label:"Purple",  sublabel:"Legendary", weight:7,  bg:"rgba(123,97,255,0.15)",  color:"#7B61FF", border:"rgba(123,97,255,0.5)",   glow:"rgba(123,97,255,0.3)"   },
};

function lootWeightedRandom() {
  const pool = [];
  LOOT_ITEMS.forEach(item => {
    const w = RARITY_CONFIG[item.rarity].weight;
    for (let i = 0; i < w; i++) pool.push(item);
  });
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 16 }, (_, i) => i > 0 && i % 4 === 0 ? "-" + chars[Math.floor(Math.random()*chars.length)] : chars[Math.floor(Math.random()*chars.length)]).join("");
}

/* ================= LOOTBOX VIEW ================= */
const LootboxView = ({ wallet, authUser, mintNFTFromLoot }) => {
  const [phase, setPhase] = React.useState("idle");
  const [winner, setWinner] = React.useState(null);
  const [spinItems, setSpinItems] = React.useState([]);
  const [history, setHistory] = React.useState([]);
  const [mintMsg, setMintMsg] = React.useState("");
  const [lootKey, setLootKey] = React.useState("");
  const trackRef = React.useRef(null);

  const rc = winner ? RARITY_CONFIG[winner.rarity] : RARITY_CONFIG.bronze;

  function startOpen() {
    if (phase !== "idle") return;
    setMintMsg("");
    setPhase("shaking");
    setTimeout(() => {
      const won = lootWeightedRandom();
      const items = [];
      for (let i = 0; i < 32; i++) items.push(i === 26 ? won : LOOT_ITEMS[Math.floor(Math.random()*LOOT_ITEMS.length)]);
      setSpinItems(items);
      setWinner(won);
      setPhase("spinning");
      setTimeout(() => setPhase("revealed"), 3400);
    }, 800);
  }

  React.useEffect(() => {
    if (phase === "spinning" && trackRef.current) {
      const itemW = 96;
      const containerW = trackRef.current.parentElement.offsetWidth;
      const target = -(26 * itemW) + containerW/2 - itemW/2;
      trackRef.current.style.transition = "none";
      trackRef.current.style.transform = "translateX(0)";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (trackRef.current) {
          trackRef.current.style.transition = "transform 3s cubic-bezier(0.12,0.8,0.3,1)";
          trackRef.current.style.transform = `translateX(${target}px)`;
        }
      }));
    }
  }, [phase, spinItems]);

  function resetBox() {
    if (winner) setHistory(prev => [winner, ...prev].slice(0, 8));
    setPhase("idle"); setWinner(null); setSpinItems([]); setMintMsg("");
  }

  async function handleMint() {
    if (!authUser) return setMintMsg("❌ Please login first");
    if (!wallet)   return setMintMsg("❌ Please connect your wallet");
    setMintMsg("⏳ Minting...");
    try {
      await mintNFTFromLoot(winner);
      setMintMsg("🎉 Minted successfully!");
    } catch(e) {
      setMintMsg("❌ " + e.message);
    }
  }

  return (
    <div style={{ padding:"32px", maxWidth:"800px", margin:"0 auto" }}>
      <h2 style={{ fontSize:"24px", fontWeight:"700", marginBottom:"6px" }}>🎁 Mystery Lootbox</h2>
      <p style={{ color:"#64748b", fontSize:"13px", marginBottom:"28px" }}>Open a lootbox to win a rare NFT. Each tier has different odds.</p>

      {/* RARITY TIER LEGEND */}
      <div style={{ display:"flex", gap:"10px", marginBottom:"32px", flexWrap:"wrap" }}>
        {Object.entries(RARITY_CONFIG).map(([key, r]) => (
          <div key={key} style={{ background:r.bg, border:`1px solid ${r.border}`, borderRadius:"10px", padding:"8px 16px", textAlign:"center", flex:1, minWidth:"100px" }}>
            <p style={{ margin:"0 0 2px", color:r.color, fontWeight:"700", fontSize:"13px" }}>{r.label}</p>
            <p style={{ margin:"0 0 2px", color:r.color, fontSize:"11px", opacity:0.8 }}>{r.sublabel}</p>
            <p style={{ margin:0, color:"#64748b", fontSize:"11px" }}>{r.weight}% chance</p>
          </div>
        ))}
      </div>

      {/* IDLE — show box */}
      {phase === "idle" && (
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div onClick={startOpen} style={{ width:"160px", height:"160px", margin:"0 auto 24px", background:"rgba(123,97,255,0.1)", border:"2px solid rgba(123,97,255,0.4)", borderRadius:"24px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.2s", fontSize:"56px" }} onMouseEnter={e => { e.currentTarget.style.transform="scale(1.07)"; e.currentTarget.style.boxShadow="0 0 30px rgba(123,97,255,0.3)"; }} onMouseLeave={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="none"; }}>
            🎁
            <span style={{ fontSize:"11px", color:"#94a3b8", marginTop:"8px", fontWeight:"600" }}>Click to open</span>
          </div>
          <button onClick={startOpen} style={{ padding:"13px 48px", borderRadius:"14px", border:"none", background:"linear-gradient(135deg,#7B61FF,#00f6ff)", color:"#fff", fontWeight:"700", fontSize:"16px", cursor:"pointer", boxShadow:"0 4px 20px rgba(123,97,255,0.3)" }}>Open Lootbox</button>
        </div>
      )}

      {/* SHAKING */}
      {phase === "shaking" && (
        <div style={{ textAlign:"center", marginBottom:"32px" }}>
          <div style={{ width:"160px", height:"160px", margin:"0 auto 20px", background:"rgba(123,97,255,0.15)", border:"2px solid #7B61FF", borderRadius:"24px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"56px", animation:"lootShake 0.45s ease infinite" }}>🎁</div>
          <p style={{ color:"#94a3b8", fontSize:"14px" }}>Shaking the box...</p>
        </div>
      )}

      {/* SPIN REEL */}
      {phase === "spinning" && (
        <div style={{ marginBottom:"32px" }}>
          <p style={{ color:"#64748b", textAlign:"center", marginBottom:"14px", fontSize:"13px" }}>Rolling...</p>
          <div style={{ overflow:"hidden", borderRadius:"16px", border:"1px solid rgba(255,255,255,0.08)", position:"relative", background:"#0a0e1a" }}>
            <div style={{ position:"absolute", top:0, bottom:0, left:"50%", width:"3px", background:"linear-gradient(to bottom,transparent,#7B61FF,transparent)", zIndex:3, transform:"translateX(-50%)" }} />
            <div style={{ position:"absolute", top:0, bottom:0, left:0, width:"100px", background:"linear-gradient(to right,#0a0e1a,transparent)", zIndex:2, pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:0, bottom:0, right:0, width:"100px", background:"linear-gradient(to left,#0a0e1a,transparent)", zIndex:2, pointerEvents:"none" }} />
            <div style={{ overflow:"hidden" }}>
              <div ref={trackRef} style={{ display:"flex", willChange:"transform" }}>
                {spinItems.map((item, i) => (
                  <div key={i} style={{ minWidth:"96px", height:"96px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderRight:"1px solid rgba(255,255,255,0.04)", gap:"4px", padding:"4px" }}>
                    <img src={item.image} alt={item.name} style={{ width:"60px", height:"60px", objectFit:"cover", borderRadius:"8px" }} />
                    <span style={{ fontSize:"9px", color:RARITY_CONFIG[item.rarity].color, fontWeight:"700", textTransform:"uppercase" }}>{RARITY_CONFIG[item.rarity].label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVEALED */}
      {phase === "revealed" && winner && (
        <div style={{ animation:"lootFadeUp 0.5s ease", marginBottom:"32px" }}>
          <p style={{ textAlign:"center", color:"#94a3b8", marginBottom:"20px", fontSize:"14px" }}>You got:</p>
          <div style={{ background:rc.bg, border:`2px solid ${rc.border}`, borderRadius:"24px", overflow:"hidden", maxWidth:"340px", margin:"0 auto", boxShadow:`0 0 40px ${rc.glow}` }}>
            <div style={{ position:"relative", height:"200px", overflow:"hidden" }}>
              <img src={winner.image} alt={winner.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              <div style={{ position:"absolute", inset:0, background:`linear-gradient(to top, ${rc.bg} 0%, transparent 60%)` }} />
              <div style={{ position:"absolute", top:"12px", right:"12px", background:rc.bg, border:`1px solid ${rc.border}`, borderRadius:"20px", padding:"4px 12px", fontSize:"11px", color:rc.color, fontWeight:"700", backdropFilter:"blur(10px)" }}>
                {rc.label} • {rc.sublabel}
              </div>
            </div>
            <div style={{ padding:"18px 22px" }}>
              <h3 style={{ fontSize:"20px", fontWeight:"700", margin:"0 0 6px", color:"#f1f5f9" }}>{winner.name}</h3>
              <p style={{ color:"#94a3b8", fontSize:"13px", marginBottom:"10px", lineHeight:1.5 }}>{winner.desc}</p>
              <p style={{ color:rc.color, fontWeight:"700", fontFamily:"monospace", fontSize:"18px", marginBottom:"18px" }}>{winner.price} ETH</p>
              <div style={{ display:"flex", gap:"10px" }}>
                <button onClick={handleMint} style={{ flex:1, padding:"11px", borderRadius:"12px", border:"none", background:`linear-gradient(135deg,${rc.color},#00f6ff)`, color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer" }}>🎨 Mint this NFT</button>
                <button onClick={resetBox} style={{ flex:1, padding:"11px", borderRadius:"12px", border:`1px solid ${rc.border}`, background:"transparent", color:"#94a3b8", fontSize:"14px", cursor:"pointer" }}>Open another</button>
              </div>
              {mintMsg && <p style={{ marginTop:"12px", fontSize:"13px", textAlign:"center", color:mintMsg.startsWith("🎉")?"#10b981":mintMsg.startsWith("⏳")?"#f59e0b":"#ef4444" }}>{mintMsg}</p>}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {history.length > 0 && (
        <div style={{ marginTop:"16px" }}>
          <h3 style={{ fontSize:"12px", color:"#475569", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"12px" }}>Recent Opens</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"10px" }}>
            {history.map((h, i) => {
              const hrc = RARITY_CONFIG[h.rarity];
              return (
                <div key={i} style={{ background:hrc.bg, border:`1px solid ${hrc.border}`, borderRadius:"12px", overflow:"hidden", display:"flex", alignItems:"center", gap:"10px", padding:"10px" }}>
                  <img src={h.image} alt={h.name} style={{ width:"42px", height:"42px", borderRadius:"8px", objectFit:"cover", flexShrink:0 }} />
                  <div style={{ minWidth:0 }}>
                    <p style={{ margin:0, fontWeight:"600", fontSize:"12px", color:"#e2e8f0", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{h.name}</p>
                    <p style={{ margin:"2px 0 0", fontSize:"11px", color:hrc.color, fontWeight:"600" }}>{hrc.label}</p>
                    <p style={{ margin:"1px 0 0", fontFamily:"monospace", fontSize:"11px", color:"#64748b" }}>{h.price} ETH</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KEY GENERATOR */}
      <div style={{ marginTop:"40px", padding:"28px", background:"rgba(0,246,255,0.04)", border:"1px solid rgba(0,246,255,0.15)", borderRadius:"20px", textAlign:"center" }}>
        <h3 style={{ fontSize:"18px", fontWeight:"700", marginBottom:"8px" }}>🔑 Unlock Key Generator</h3>
        <p style={{ color:"#64748b", fontSize:"13px", marginBottom:"20px" }}>Generate a unique key to unlock special in-game items and exclusive drops.</p>
        <button onClick={() => setLootKey(generateKey())} style={{ padding:"11px 36px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#00f6ff,#7B61FF)", color:"#fff", fontWeight:"700", fontSize:"14px", cursor:"pointer", boxShadow:"0 4px 16px rgba(0,246,255,0.2)" }}>
          {lootKey ? "Generate New Key" : "Generate Key"}
        </button>
        {lootKey && (
          <div style={{ marginTop:"20px", background:"#060a14", border:"1px solid rgba(0,246,255,0.3)", borderRadius:"12px", padding:"18px 24px", display:"inline-block" }}>
            <p style={{ margin:"0 0 8px", fontSize:"11px", color:"#475569", textTransform:"uppercase", letterSpacing:"0.1em" }}>Your Key</p>
            <p style={{ margin:0, fontFamily:"monospace", fontSize:"20px", color:"#00f6ff", letterSpacing:"3px", fontWeight:"600" }}>{lootKey}</p>
            <button onClick={() => { navigator.clipboard.writeText(lootKey); }} style={{ marginTop:"12px", padding:"6px 20px", borderRadius:"8px", border:"1px solid rgba(0,246,255,0.3)", background:"transparent", color:"#00f6ff", fontSize:"12px", cursor:"pointer" }}>📋 Copy Key</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes lootShake { 0%,100%{transform:translateX(0) rotate(0)} 20%{transform:translateX(-10px) rotate(-4deg)} 40%{transform:translateX(10px) rotate(4deg)} 60%{transform:translateX(-7px) rotate(-2deg)} 80%{transform:translateX(7px) rotate(2deg)} }
        @keyframes lootFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};

/* ================= APP ================= */
function App() {
  const [authUser, setAuthUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [view, setView] = useState("market");
  const [profile, setProfile] = useState(null);
  const [category, setCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState("");
  const [contract, setContract] = useState(null);
  const [marketNFTs, setMarketNFTs] = useState([]);
  const [mintedNFTs, setMintedNFTs] = useState([]);
  const [purchasedNFTs, setPurchasedNFTs] = useState([]);
  const [savedNFTs, setSavedNFTs] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [price, setPrice] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [nftName, setNftName] = useState("");
  const [description, setDescription] = useState("");
  const [nftCategory, setNftCategory] = useState("Gaming");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [publicProfileWallet, setPublicProfileWallet] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") !== "light");
  const [swapAmount, setSwapAmount] = useState("");
  const [blockchainOnline, setBlockchainOnline] = useState(true);
  const [likes, setLikes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("nft_likes") || "{}"); } catch { return {}; }
  });
  const [sortBy, setSortBy] = useState("default");
  const [modal, setModal] = useState(null); // { type, variant, icon, title, message, confirmText, onConfirm }
  // ── Profile settings fields ──────────────────────────────
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [discord, setDiscord] = useState("");

  function showToast(type, message, price = "") {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message, price }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }
  function removeToast(id) { setToasts(prev => prev.filter(t => t.id !== id)); }

  // ── Dark/Light mode ───────────────────────────────────────
  function toggleTheme() {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }

  // ── Like / Favorite NFT ───────────────────────────────────
  function toggleLike(tokenId) {
    setLikes(prev => {
      const key = String(tokenId);
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("nft_likes", JSON.stringify(updated));
      return updated;
    });
  }

  function getLikeCount(tokenId) {
    return likes[String(tokenId)] ? 1 : 0;
  }

  // ── Modal helpers (replaces browser alert/confirm) ────────
  function showAlert(message, variant = "info", title = "", icon = "") {
    setModal({ type:"alert", variant, title, message, icon });
  }

  function showConfirm(message, onConfirm, title = "", confirmText = "Confirm", variant = "warning") {
    setModal({ type:"confirm", variant, title, message, confirmText, onConfirm });
  }

  async function fetchNotifications(email) {
    try { const res = await axios.get(`${API}/api/notifications/${email}`); setNotifications(res.data); setUnreadCount(res.data.filter(n => !n.read).length); } catch(e) {}
  }
  async function addNotification(userEmail, type, message, nftName, nftImage, price, tokenId) {
    try { await axios.post(`${API}/api/notifications/add`, { userEmail, type, message, nftName, nftImage, price, tokenId }); await fetchNotifications(userEmail); } catch(e) {}
  }
  async function markAllRead() {
    if (!authUser) return;
    try { await axios.patch(`${API}/api/notifications/read/${authUser.email}`); setUnreadCount(0); setNotifications(prev => prev.map(n => ({...n, read:true}))); } catch(e) {}
  }
  async function clearNotifications() {
    if (!authUser) return;
    try { await axios.delete(`${API}/api/notifications/clear/${authUser.email}`); setNotifications([]); setUnreadCount(0); } catch(e) {}
  }

  // ── Restore session on page load ─────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setAuthUser(user);
        // Immediately load this user's NFTs
        axios.get(`${API}/api/nfts/${user.email}`)
          .then(res => setSavedNFTs(res.data || []))
          .catch(() => {});
      } catch(e) {
        localStorage.removeItem("user");
      }
    }
  }, []);

  // ── Apply theme to document ───────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute("data-theme", "dark");
      document.body.style.background = "#06080f";
      document.body.style.color = "#e8edf5";
    } else {
      root.setAttribute("data-theme", "light");
      document.body.style.background = "#f0f4f8";
      document.body.style.color = "#1a1f2e";
    }
  }, [darkMode]);

  useEffect(() => {
    if (authUser) {
      // Load profile
      axios.get(`${API}/api/profile/${authUser.email}`)
        .then(res => {
          setProfile(res.data);
          if (res.data) {
            setUsername(res.data.username   || "");
            setBio(res.data.bio             || "");
            setTwitter(res.data.twitter     || "");
            setInstagram(res.data.instagram || "");
            setDiscord(res.data.discord     || "");
          }
        }).catch(() => {});
      // Load THIS user's saved NFTs from MongoDB
      axios.get(`${API}/api/nfts/${authUser.email}`)
        .then(res => setSavedNFTs(res.data || []))
        .catch(() => setSavedNFTs([]));
    } else {
      // Logged out — clear user data
      setProfile(null);
      setSavedNFTs([]);
    }
  }, [authUser]);

  useEffect(() => {
    // Always load market NFTs when visiting these views
    if (view === "market" || view === "discover" || view === "collections") {
      loadAllNFTs();
    }
  }, [contract, wallet, view, authUser]);

  // Also load on first mount regardless of view
  useEffect(() => {
    loadAllNFTs();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    fetchNotifications(authUser.email);
    const interval = setInterval(() => fetchNotifications(authUser.email), 30000);
    return () => clearInterval(interval);
  }, [authUser]);

  useEffect(() => {
    if (!window.ethereum) return;
    const syncWallet = async () => {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length === 0) return;
        const activeWallet = accounts[0].toLowerCase();
        setWallet(prev => {
          const prevLower = prev ? prev.toLowerCase() : "";
          if (prevLower !== activeWallet) {
            (async () => {
              try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const mc = new ethers.Contract(marketplace.address, marketplace.abi, signer);
                setContract(mc);
              } catch(e) {}
            })();
            return accounts[0];
          }
          return prev;
        });
      } catch(e) {}
    };
    const handleAccountChange = async (accounts) => {
      if (accounts.length === 0) { setWallet(""); setContract(null); }
      else {
        const newWallet = accounts[0];
        setWallet(newWallet);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const mc = new ethers.Contract(marketplace.address, marketplace.abi, signer);
        setContract(mc);
        if (authUser) { try { await axios.post(`${API}/api/profile/save`, { email: authUser.email, wallet: newWallet }); } catch(e) {} }
      }
    };
    const handleChainChange = () => window.location.reload();
    window.ethereum.on("accountsChanged", handleAccountChange);
    window.ethereum.on("chainChanged", handleChainChange);
    const pollInterval = setInterval(syncWallet, 1000);
    return () => { window.ethereum.removeListener("accountsChanged", handleAccountChange); window.ethereum.removeListener("chainChanged", handleChainChange); clearInterval(pollInterval); };
  }, [authUser]);

  async function login() {
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      const user = res.data.user;
      localStorage.setItem("user", JSON.stringify(user));
      setAuthUser(user);
      // Load this user's NFTs immediately after login
      try {
        const nftRes = await axios.get(`${API}/api/nfts/${user.email}`);
        setSavedNFTs(nftRes.data || []);
      } catch(_) {}
      setView("market");
      setEmail(""); setPassword("");
    } catch(err) {
      showAlert("Login failed. Check your email/password and make sure the backend is running.", "error", "Login Failed", "🔐");
    }
  }

  async function register() {
    try {
      await axios.post(`${API}/api/auth/register`, { name, email, password });
      showAlert("Account created! You can now login with your credentials.", "success", "Registered!", "🎉");
      setView("login");
    } catch(err) { showAlert("Registration failed. Please try again.", "error", "Error"); }
  }

  function logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("nft_likes");
    setAuthUser(null);
    setWallet(""); setContract(null);
    setSavedNFTs([]); setProfile(null);
    setNotifications([]); setUnreadCount(0);
    setUsername(""); setBio(""); setTwitter(""); setInstagram(""); setDiscord("");
    setView("market");
    // Reload marketplace without user context
    loadAllNFTs();
  }

  async function connectWallet() {
    if (!window.ethereum) return showAlert("MetaMask is not installed. Please install it from metamask.io and refresh the page.", "error", "MetaMask Required", "🦊");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const marketplaceContract = new ethers.Contract(marketplace.address, marketplace.abi, signer);
    setWallet(accounts[0]);
    setContract(marketplaceContract);
    if (authUser) { try { await axios.post(`${API}/api/profile/save`, { email: authUser.email, wallet: accounts[0] }); } catch(e) {} }
  }

  async function loadAllNFTs() {
    setLoading(true);
    let blockchainWorking = false;

    try {
      let readProvider;
      
      // ✅ Use MetaMask if available, otherwise check if we are local
      if (window.ethereum) {
        readProvider = new ethers.BrowserProvider(window.ethereum);
      } else if (window.location.hostname === "localhost") {
        readProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
      }

      if (readProvider) {
        const readContract = new ethers.Contract(marketplace.address, marketplace.abi, readProvider);
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 3000));
        
        // Use getAllNFTs from the contract
        const listed = await Promise.race([readContract.getAllNFTs(), timeout]);
        const resolved = await resolveNFTs(listed, readContract);
        
        setMarketNFTs(resolved);
        setBlockchainOnline(true);
        blockchainWorking = true;

        // Load personal NFTs if wallet connected
        if (contract && wallet) {
          try {
            const mine = await contract.getMyNFTs();
            const myResolved = await resolveNFTs(mine, contract);
            setMintedNFTs(myResolved.filter(n => n.seller?.toLowerCase() === wallet.toLowerCase()));
            setPurchasedNFTs(myResolved.filter(n =>
              n.owner?.toLowerCase() === wallet.toLowerCase() &&
              n.seller?.toLowerCase() !== wallet.toLowerCase()
            ));
          } catch (_) {}
        }
      }
    } catch (chainErr) {
      console.log("Blockchain connection failed, falling back to DB...");
      blockchainWorking = false;
    }

    // ── Fallback: load ALL NFTs from MongoDB ─────────────────────────
    if (!blockchainWorking) {
      setBlockchainOnline(false);
      try {
        const res = await axios.get(`${API}/api/nfts/all`);
        const dbNFTs = (res.data || []).map(n => ({
          tokenId: n.tokenId || n._id,
          name: n.name || "Unnamed NFT",
          description: n.description || "",
          image: n.image || "",
          price: n.price || "0",
          seller: n.seller || n.owner || "",
          owner: n.owner || "",
          category: n.category || "Gaming",
          fromDB: true,
        }));
        setMarketNFTs(dbNFTs);
      } catch (dbErr) {
        console.error("Database fetch failed:", dbErr);
        setMarketNFTs([]);
      }
    }
    setLoading(false);
  }
  async function resolveNFTs(data, contractInstance) {
    const c = contractInstance || contract;
    return Promise.all(data.map(async (i) => {
      const tokenId = i.tokenId !== undefined ? i.tokenId : i[0];
      const tokenURI = await c.tokenURI(tokenId);
      const meta = await axios.get(tokenURI);
      return { tokenId, owner: i.owner??i[2], seller: i.seller??i[1], price: i.price??i[3], image: meta.data.image, name: meta.data.name, description: meta.data.description, category: meta.data.category||"Gaming" };
    }));
  }

  async function uploadToPinata(selectedFile) {
    const data = new FormData();
    data.append("file", selectedFile);
    const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", data, { maxBodyLength:"Infinity", headers: { Authorization: `Bearer ${PINATA_JWT}` } });
    return `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;
  }

  async function mintNFT() {
    if (!authUser) return showAlert("Please login to your account first.", "warning", "Login Required", "🔐");
    if (!wallet) return showAlert("Connect your MetaMask wallet to continue.", "warning", "Wallet Required", "🦊");
    if (!contract) return showAlert("Contract not loaded. Please disconnect and reconnect your wallet.", "error", "Contract Error", "⚡");
    if (!file) return showAlert("Please select an image file for your NFT.", "warning", "Missing Image", "🖼️");
    if (!nftName.trim()) return showAlert("Please enter a name for your NFT.", "warning", "Missing Name", "✏️");
    if (!price || isNaN(price) || Number(price) <= 0) return showAlert("Please enter a valid price in ETH (e.g. 0.01).", "warning", "Invalid Price", "💰");
    setLoading(true);
    try {
      let imageURL;
      try { imageURL = await uploadToPinata(file); } catch(e) { showAlert("Image upload failed: " + (e.response?.data?.error?.details || e.message), "error", "Upload Failed", "📤"); setLoading(false); return; }
      let tokenURI;
      try {
        const meta = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", { name: nftName, description, image: imageURL, category: nftCategory }, { headers: { Authorization: `Bearer ${PINATA_JWT}` } });
        tokenURI = `https://gateway.pinata.cloud/ipfs/${meta.data.IpfsHash}`;
      } catch(e) { showAlert("Metadata upload failed: " + (e.response?.data?.error?.details || e.message), "error", "Upload Failed", "📤"); setLoading(false); return; }
      let listPrice;
      try { listPrice = await contract.getListPrice(); } catch(e) { showAlert("Cannot read contract: " + e.message, "error", "Contract Error", "⚡"); setLoading(false); return; }
      let receipt;
      try {
        const tx = await contract.createToken(tokenURI, ethers.parseEther(price), { value: listPrice });
        receipt = await tx.wait();
      } catch(e) {
        if (e.code === 4001 || e.code === "ACTION_REJECTED" || e.message?.includes("user rejected")) showAlert("Transaction was rejected in MetaMask.", "warning", "Rejected", "🦊");
        else if (e.message?.includes("insufficient funds")) showAlert("Insufficient ETH in your wallet. Add more ETH to continue.", "error", "Insufficient Funds", "💸");
        else showAlert("Transaction failed: " + (e.reason || e.message), "error", "Transaction Failed", "❌");
        setLoading(false); return;
      }
      let tokenId = null;
      try {
        const events = receipt.logs.map(log => { try { return contract.interface.parseLog(log); } catch { return null; } }).filter(Boolean);
        const listed = events.find(e => e.name === "TokenListedSuccess");
        const transfer = events.find(e => e.name === "Transfer");
        if (listed) tokenId = listed.args.tokenId.toString();
        else if (transfer) tokenId = transfer.args.tokenId.toString();
      } catch(e) {}
      if (!tokenId) { try { tokenId = (await contract.getCurrentToken()).toString(); } catch(e) {} }
      if (!tokenId) tokenId = `${wallet.slice(2,8)}_${Date.now()}`;
      try {
        await axios.post(`${API}/api/nfts/save`, { ownerEmail: authUser.email, tokenId, name: nftName, description, image: imageURL, category: nftCategory, price, seller: wallet, owner: wallet, tokenURI });
      } catch(e) { showAlert("NFT minted on blockchain but not saved to database: " + (e.response?.data?.error || e.message), "warning", "Partial Success", "⚠️"); setLoading(false); loadAllNFTs(); return; }
      try { await axios.post(`${API}/api/history/add`, { tokenId, nftName, nftImage: imageURL, event: "Minted", price, from: wallet, to: wallet, fromEmail: authUser.email, toEmail: authUser.email }); } catch(e) {}
      showToast("Minted", `"${nftName}" minted successfully!`, price);
      await addNotification(authUser.email, "Minted", `You minted "${nftName}" for ${price} ETH`, nftName, imageURL, price, tokenId);
      try { const nftRes = await axios.get(`${API}/api/nfts/${authUser.email}`); setSavedNFTs(nftRes.data); } catch(e) {}
      loadAllNFTs();
      showAlert("Your NFT has been minted and saved successfully!", "success", "NFT Minted!", "🎨");
      setView("discover");
    } catch(e) { showAlert("Unexpected error: " + e.message, "error", "Error"); }
    finally { setLoading(false); }
  }

  async function buyNFT(id, nftPrice) {
    if (!authUser) return showAlert("Please login to your account first.", "warning", "Login Required", "🔐");
    setLoading(true);
    try {
      const nftToBuy = marketNFTs.find(n => n.tokenId.toString() === id.toString());
      const tx = await contract.executeSale(id, { value: nftPrice });
      await tx.wait();
      await axios.post(`${API}/api/nfts/transfer`, { tokenId: String(id), newOwnerEmail: authUser.email, newOwner: wallet });
      try {
        const priceInEth = ethers.formatEther(nftPrice);
        await axios.post(`${API}/api/history/add`, { tokenId: String(id), nftName: nftToBuy?.name||"", nftImage: nftToBuy?.image||"", event: "Sale", price: priceInEth, from: nftToBuy?.seller||"", to: wallet, fromEmail: "", toEmail: authUser.email });
      } catch(e) {}
      const priceEth = ethers.formatEther(nftPrice);
      showToast("Purchased", `You bought "${nftToBuy?.name||"NFT"}"!`, priceEth);
      await addNotification(authUser.email, "Purchased", `You purchased "${nftToBuy?.name||"NFT"}" for ${priceEth} ETH`, nftToBuy?.name||"", nftToBuy?.image||"", priceEth, String(id));
      try {
        const sellerNFT = await axios.get(`${API}/api/nfts/${String(id)}`).catch(() => null);
        if (sellerNFT?.data?.ownerEmail && sellerNFT.data.ownerEmail !== authUser.email) await addNotification(sellerNFT.data.ownerEmail, "Sold", `Your NFT "${nftToBuy?.name||"NFT"}" sold for ${priceEth} ETH!`, nftToBuy?.name||"", nftToBuy?.image||"", priceEth, String(id));
      } catch(e) {}
      const nftRes = await axios.get(`${API}/api/nfts/${authUser.email}`);
      setSavedNFTs(nftRes.data);
      loadAllNFTs();
    } catch(err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function unlistNFT(id) {
    setLoading(true);
    try { const tx = await contract.unlistNFT(id); await tx.wait(); loadAllNFTs(); }
    catch(err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function mintNFTFromLoot(item) {
    if (!authUser) throw new Error("Please login first");
    if (!wallet) throw new Error("Please connect your wallet");
    if (!contract) throw new Error("Contract not loaded");
    // Fetch the actual loot image as a file and upload to Pinata
    const imgRes = await fetch(item.image);
    const imgBlob = await imgRes.blob();
    const imgFile = new File([imgBlob], `${item.id}.jpeg`, { type: "image/jpeg" });
    const imageURL = await uploadToPinata(imgFile);
    const meta = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", { name: item.name, description: item.desc, image: imageURL, category: item.category }, { headers: { Authorization: `Bearer ${PINATA_JWT}` } });
    const tokenURI = `https://gateway.pinata.cloud/ipfs/${meta.data.IpfsHash}`;
    const listPrice = await contract.getListPrice();
    const tx = await contract.createToken(tokenURI, ethers.parseEther(item.price), { value: listPrice });
    const receipt = await tx.wait();
    let tokenId = null;
    try { const events = receipt.logs.map(log => { try { return contract.interface.parseLog(log); } catch { return null; } }).filter(Boolean); const transfer = events.find(e => e.name === "Transfer"); if (transfer) tokenId = transfer.args.tokenId.toString(); } catch(e) {}
    if (!tokenId) tokenId = `loot_${Date.now()}`;
    await axios.post(`${API}/api/nfts/save`, { ownerEmail: authUser.email, tokenId, name: item.name, description: item.desc, image: imageURL, category: item.category, price: item.price, seller: wallet, owner: wallet, tokenURI });
    await axios.post(`${API}/api/history/add`, { tokenId, nftName: item.name, nftImage: imageURL, event: "Minted", price: item.price, from: wallet, to: wallet, fromEmail: authUser.email, toEmail: authUser.email });
    showToast("Minted", `"${item.name}" minted from lootbox!`, item.price);
    const nftRes = await axios.get(`${API}/api/nfts/${authUser.email}`);
    setSavedNFTs(nftRes.data);
    loadAllNFTs();
  }

  async function deleteNFT(tokenId) {
    showConfirm(
      "This will permanently remove this NFT from your collection. This cannot be undone.",
      async () => {
        try {
          await axios.delete(`${API}/api/nfts/one/${tokenId}`);
          setSavedNFTs(prev => prev.filter(n => String(n.tokenId) !== String(tokenId)));
          showToast("info", "NFT removed from collection");
        } catch(err) { showToast("error", "Failed to remove NFT"); }
      },
      "Remove NFT",
      "Remove",
      "error"
    );
  }

  async function saveProfile() {
    if (!authUser) return showAlert("Please login to your account first.", "warning", "Login Required", "🔐");
    try {
      const avatarURL = avatarFile ? await uploadToPinata(avatarFile) : (profile?.avatar || "");
      const bannerURL = bannerFile ? await uploadToPinata(bannerFile) : (profile?.banner || "");
      await axios.post(`${API}/api/profile/save`, {
        email:    authUser.email,
        avatar:   avatarURL,
        banner:   bannerURL,
        username: username,
        bio:      bio,
        twitter:  twitter,
        instagram:instagram,
        discord:  discord,
        wallet:   wallet,
      });
      // Refresh profile
      const res = await axios.get(`${API}/api/profile/${authUser.email}`);
      setProfile(res.data);
      showToast("info", "Profile saved successfully!");
    } catch(e) {
      showAlert("Failed to save profile: " + e.message, "error", "Save Failed");
    }
  }

  /* ================= RENDER ================= */
  return (
    <>
    <div className="app-layout">
      <Sidebar setView={setView} />
      <div className="main">

        {/* NAVBAR */}
        <div className="navbar">
          <div className="nav-left">
            <h1 onClick={() => { setView("market"); setSelectedCollection(null); }} style={{ cursor:"pointer" }}>🎮 NFT Marketplace</h1>
            <input className="search" placeholder="Search NFTs..." onChange={(e) => setSearchQuery(e.target.value.toLowerCase())} />
          </div>
          <div className="categories">
            {["All","Gaming","Art","Music","Photography","Sports","Collectible"].map(cat => (
              <button key={cat} className={category === cat ? "active" : ""} onClick={() => { setCategory(cat); setView("market"); }}>{cat}</button>
            ))}
          </div>
          <div className="nav-right">
            {!authUser ? (
              <><button onClick={() => setView("login")}>Login</button><button onClick={() => setView("register")}>Register</button></>
            ) : (
              <>
                <button onClick={() => setView("create")}>Mint</button>
                <button onClick={() => setView("profile")}>Profile</button>
                {!wallet ? <button onClick={connectWallet}>Connect Wallet</button> : <span className="wallet-box">{wallet.slice(0,6)}...</span>}
                <NotificationBell notifications={notifications} unreadCount={unreadCount} onMarkRead={markAllRead} onClear={clearNotifications} />
                {/* THEME TOGGLE */}
                <button
                  onClick={toggleTheme}
                  title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  style={{
                    background: darkMode ? "rgba(255,246,0,0.1)" : "rgba(0,0,30,0.1)",
                    border: darkMode ? "1px solid rgba(255,246,0,0.3)" : "1px solid rgba(0,0,80,0.2)",
                    borderRadius:"10px", padding:"8px 12px", cursor:"pointer",
                    fontSize:"1.1rem", transition:"all 0.2s"
                  }}
                >
                  {darkMode ? "☀️" : "🌙"}
                </button>
                <button onClick={logout}>Logout</button>
              </>
            )}
          </div>
        </div>

        {/* LOADING */}
        {loading && <div className="loader-container"><div className="spinner"></div><p>Processing...</p></div>}

        {/* MARKET / DISCOVER */}
        {(view === "market" || view === "discover") && !selectedCollection && !publicProfileWallet && !loading && (
          <div className="animate">
            <div style={{ padding:"20px 20px 0" }}>
              <UserSearchBar API={API} onSelectWallet={(w) => setPublicProfileWallet(w)} />
            </div>
            <div className="hero-slider">
              <Swiper modules={[Navigation, Pagination, Autoplay]} spaceBetween={30} slidesPerView={1} navigation pagination={{ clickable: true }} autoplay={{ delay: 3500 }} loop>
                <SwiperSlide><div className="hero-card"><img src="/ads/nft1.jpg" alt="" /><div className="hero-info"><h2>Cyberpunk Legends</h2><p>Explore rare pixel heroes</p></div></div></SwiperSlide>
                <SwiperSlide><div className="hero-card"><img src="/ads/nft2.jpg" alt="" /><div className="hero-info"><h2>Metaverse Warriors</h2><p>Limited drops available</p></div></div></SwiperSlide>
              </Swiper>
            </div>

            {authUser && savedNFTs.length > 0 && (
              <div style={{ marginBottom:"40px" }}>
                {/* YOUR NFTs HEADER + SORT BAR */}
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px 14px", flexWrap:"wrap", gap:"10px" }}>
                  <h2 style={{ color:"#00e5ff", margin:0, fontSize:"18px" }}>
                    🖼️ Your NFTs
                    <span style={{ marginLeft:"10px", fontSize:"13px", color:"#475569", fontWeight:"normal" }}>
                      ({savedNFTs.filter(n => category==="All"||n.category===category).length})
                    </span>
                  </h2>
                  <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                    <span style={{ fontSize:"12px", color:"#64748b" }}>Sort:</span>
                    {[["default","Latest"],["price_asc","Price ↑"],["price_desc","Price ↓"],["liked","❤️ Liked"]].map(([val, label]) => (
                      <button key={val} onClick={() => setSortBy(val)} style={{
                        padding:"5px 12px", borderRadius:"20px", border:"none", cursor:"pointer",
                        fontSize:"12px", fontWeight:"600", transition:"all 0.2s",
                        background: sortBy===val ? "rgba(0,229,255,0.15)" : darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
                        color: sortBy===val ? "#00e5ff" : "#94a3b8",
                        outline: sortBy===val ? "1px solid rgba(0,229,255,0.3)" : "none"
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ height:"1px", background:"rgba(0,229,255,0.15)", margin:"0 20px 16px" }} />
                <div className="grid">
                  {(() => {
                    const filtered = savedNFTs
                      .filter(n => (category==="All"||n.category===category) && n.name.toLowerCase().includes(searchQuery))
                      .filter(n => sortBy==="liked" ? likes[String(n.tokenId)] : true)
                      .sort((a,b) => {
                        if (sortBy==="price_asc")  return parseFloat(a.price||0) - parseFloat(b.price||0);
                        if (sortBy==="price_desc") return parseFloat(b.price||0) - parseFloat(a.price||0);
                        return 0;
                      });
                    if (filtered.length === 0) return (
                      <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"40px 20px", color:"#4a5568" }}>
                        <p style={{ fontSize:"2.5rem" }}>{sortBy==="liked" ? "💔" : "🔍"}</p>
                        <p style={{ marginTop:"12px", color:"#8892a4", fontSize:"14px" }}>
                          {sortBy==="liked" ? "No liked NFTs yet — click ❤️ on a card." : "No NFTs match this filter."}
                        </p>
                      </div>
                    );
                    return filtered.map((nft, i) => {
                      const isLikedSaved = !!likes[String(nft.tokenId)];
                      return (
                        <div key={i} className="nft-card" style={{
                          background: darkMode ? "var(--bg-card)" : "#ffffff",
                          border: darkMode ? "1px solid rgba(0,246,255,0.3)" : "1px solid #bae6fd",
                          position:"relative"
                        }}>
                          <button onClick={() => toggleLike(nft.tokenId)} style={{ position:"absolute", top:"10px", right:"10px", zIndex:2, background: isLikedSaved ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.5)", border:"none", borderRadius:"50%", width:"32px", height:"32px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", backdropFilter:"blur(4px)" }}>
                            {isLikedSaved ? "❤️" : "🤍"}
                          </button>
                          <img src={nft.image} alt={nft.name} onClick={() => setSelectedCollection(nft)} style={{ cursor:"pointer" }} />
                          <h3 style={{ color: darkMode ? "#e8edf5" : "#1a1f2e" }}>{nft.name}</h3>
                          <p style={{ color:"#00f6ff" }}>{nft.price} ETH</p>
                          <span>{nft.category}</span>
                          {nft.seller && <p onClick={() => setPublicProfileWallet(nft.seller)} className="nft-wallet-line" title="View creator profile">👤 {nft.seller.slice(0,6)}...{nft.seller.slice(-4)}</p>}
                          <button className="btn-danger" onClick={() => deleteNFT(nft.tokenId)}>🗑 Remove</button>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* MARKETPLACE SECTION */}
            {!blockchainOnline && (
              <div style={{ margin:"0 20px 16px", padding:"12px 18px", background:"rgba(240,180,41,0.08)", border:"1px solid rgba(240,180,41,0.25)", borderRadius:"12px", display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontSize:"18px" }}>⚠️</span>
                <div>
                  <p style={{ margin:0, fontWeight:"700", color:"#f0b429", fontSize:"13px" }}>Blockchain Offline</p>
                  <p style={{ margin:"2px 0 0", color:"#8892a4", fontSize:"12px" }}>Hardhat is not running. Showing NFTs from database. Start Hardhat to enable buying/selling.</p>
                </div>
                <button
                  onClick={loadAllNFTs}
                  style={{ marginLeft:"auto", padding:"6px 14px", borderRadius:"8px", border:"1px solid rgba(240,180,41,0.4)", background:"transparent", color:"#f0b429", fontWeight:"700", fontSize:"12px", cursor:"pointer", whiteSpace:"nowrap" }}
                >
                  🔄 Retry
                </button>
              </div>
            )}
            <div style={{ padding:"0 20px 14px", display:"flex", alignItems:"center" }}>
              <h2 style={{ color:"#94a3b8", margin:0, fontSize:"18px" }}>
                🛒 Marketplace
                <span style={{ marginLeft:"10px", fontSize:"13px", color:"#475569", fontWeight:"normal" }}>
                  ({marketNFTs.filter(n => category==="All"||n.category===category).length} NFTs)
                </span>
              </h2>
            </div>
            <div style={{ height:"1px", background:"rgba(148,163,184,0.15)", margin:"0 20px 16px" }} />
            {(() => {
              const filtered = [...marketNFTs]
                .filter(n => (category==="All"||n.category===category) && n.name.toLowerCase().includes(searchQuery));
              if (filtered.length === 0) return (
                <div style={{ textAlign:"center", padding:"80px 20px", color:"#4a5568" }}>
                  <p style={{ fontSize:"4rem" }}>🏪</p>
                  <p style={{ marginTop:"16px", fontSize:"16px", color:"#8892a4", fontWeight:"600" }}>
                    {marketNFTs.length === 0 ? "Marketplace is empty" : "No NFTs match your filter"}
                  </p>
                  <p style={{ marginTop:"8px", fontSize:"13px", color:"#4a5568" }}>
                    {marketNFTs.length === 0 ? "Be the first to mint an NFT!" : "Try a different category or search term."}
                  </p>
                  {marketNFTs.length === 0 && authUser && (
                    <button onClick={()=>setView("create")} style={{ marginTop:"20px", padding:"11px 28px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#00e5ff,#38bdf8)", color:"#04050a", fontWeight:"800", cursor:"pointer", fontSize:"14px" }}>Mint First NFT</button>
                  )}
                </div>
              );
              return (
              <div className="grid">
                {filtered.map((nft, i) => {
                const isOwner = wallet && nft.seller && wallet.toLowerCase() === nft.seller.toLowerCase();
                const priceEth = nft.fromDB ? parseFloat(nft.price||0).toFixed(4) : (() => { try { return ethers.formatEther(nft.price); } catch { return nft.price||"0"; } })();
                const isLiked = !!likes[String(nft.tokenId)];
                return (
                  <div key={i} className="nft-card" style={{
                    background: darkMode ? "var(--bg-card)" : "#ffffff",
                    border: darkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e2e8f0",
                    position:"relative"
                  }}>
                    {/* LIKE BUTTON */}
                    <button
                      onClick={() => toggleLike(nft.tokenId)}
                      title={isLiked ? "Remove from favorites" : "Add to favorites"}
                      style={{
                        position:"absolute", top:"10px", right:"10px", zIndex:2,
                        background: isLiked ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.5)",
                        border:"none", borderRadius:"50%",
                        width:"32px", height:"32px", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"14px", transition:"all 0.2s",
                        backdropFilter:"blur(4px)"
                      }}
                    >
                      {isLiked ? "❤️" : "🤍"}
                    </button>
                    <img src={nft.image} alt="" onClick={() => setSelectedCollection(nft)} style={{ cursor:"pointer" }} />
                    <h3 style={{ color: darkMode ? "#e8edf5" : "#1a1f2e" }}>{nft.name}</h3>
                    <p style={{ color:"#00f6ff" }}>{priceEth} ETH</p>
                    {!wallet && !nft.fromDB && (
                      <button onClick={connectWallet} style={{ background:"linear-gradient(135deg,#7B61FF,#00f6ff)" }}>
                        🔗 Connect Wallet
                      </button>
                    )}
                    {nft.fromDB ? (
                      <button disabled style={{ opacity:0.4, cursor:"not-allowed", fontSize:"12px" }}>
                        🔌 Start Hardhat to Trade
                      </button>
                    ) : (
                      <>
                        {wallet && isOwner && (
                          <button className="btn-danger" onClick={() => unlistNFT(nft.tokenId)}>
                            🗑 Remove Listing
                          </button>
                        )}
                        {wallet && !isOwner && (
                          <button onClick={() => buyNFT(nft.tokenId, nft.price)} style={{ background:"linear-gradient(135deg,#00e5ff,#38bdf8)", color:"#04050a", fontWeight:"800" }}>
                            🛒 Buy — {priceEth} ETH
                          </button>
                        )}
                      </>
                    )}
                    {nft.seller && (
                      <p onClick={() => setPublicProfileWallet(nft.seller)} style={{ margin:"6px 0 0", fontFamily:"monospace", fontSize:"0.7rem", color:"#475569", cursor:"pointer" }} title="View seller profile">
                        👤 {nft.seller.slice(0,6)}...{nft.seller.slice(-4)}
                      </p>
                    )}
                  </div>
                );
              })}
              </div>
              );
            })()}
          </div>
        )}

        {/* ── TOKENS ── */}
        {view === "tokens" && (
          <div className="page-section animate">
            <h2>🪙 Tokens Dashboard</h2>
            {!wallet ? (
              <div style={{ textAlign:"center", padding:"60px 20px", color:"#4a5568" }}>
                <p style={{ fontSize:"3rem" }}>🔌</p>
                <p style={{ marginTop:"12px", color:"#8892a4", fontSize:"15px" }}>Connect your wallet to view your token dashboard.</p>
                <button onClick={connectWallet} style={{ marginTop:"20px", padding:"11px 28px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#00e5ff,#38bdf8)", color:"#04050a", fontWeight:"800", cursor:"pointer", fontSize:"14px" }}>Connect Wallet</button>
              </div>
            ) : (
              <>
                <div className="token-grid">
                  {[
                    { label:"Wallet",     val:`${wallet.slice(0,6)}...${wallet.slice(-4)}`, color:"#00e5ff", mono:true },
                    { label:"NFTs Owned", val:savedNFTs.length,                             color:"#8b5cf6" },
                    { label:"NFTs Listed",val:marketNFTs.filter(n=>n.seller?.toLowerCase()===wallet.toLowerCase()).length, color:"#f0b429" },
                    { label:"Portfolio",  val:savedNFTs.reduce((s,n)=>s+parseFloat(n.price||0),0).toFixed(3)+" ETH", color:"#00c896" },
                  ].map(({label,val,color,mono})=>(
                    <div key={label} className="token-card">
                      <h3>{label}</h3>
                      <p style={{ color, fontFamily:mono?"'JetBrains Mono',monospace":undefined, fontSize:mono?"13px":undefined }}>{val}</p>
                    </div>
                  ))}
                </div>
                <div className="staking-box" style={{ marginTop:"24px" }}>
                  <h3 style={{ marginBottom:"8px" }}>🔒 NFT Staking</h3>
                  <p style={{ color:"#8892a4", fontSize:"13.5px", marginBottom:"16px" }}>Select an NFT to stake and earn 10 $GAME per day.</p>
                  {savedNFTs.length === 0 ? (
                    <p style={{ color:"#4a5568", fontSize:"13px", marginBottom:"14px" }}>No NFTs to stake yet. Mint one first!</p>
                  ) : (
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:"10px", marginBottom:"16px" }}>
                      {savedNFTs.slice(0,6).map((nft,i)=>(
                        <div key={i} onClick={()=>showAlert(`"${nft.name}" staking launches on Sepolia soon!`,"info","Stake NFT","🔒")}
                          style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"10px", cursor:"pointer", transition:"all 0.2s", textAlign:"center" }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(0,229,255,0.3)";e.currentTarget.style.transform="translateY(-2px)";}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.transform="none";}}>
                          <img src={nft.image} alt="" style={{ width:"100%", height:"70px", objectFit:"cover", borderRadius:"8px", marginBottom:"6px" }} />
                          <p style={{ fontSize:"11px", fontWeight:"600", color:"#8892a4", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{nft.name}</p>
                          <p style={{ fontSize:"10px", color:"#f0b429", marginTop:"2px" }}>+10/day</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
                    <button onClick={()=>showAlert("NFT Staking launches on Sepolia soon!","info","Coming Soon","🔒")} style={{ padding:"10px 20px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#8b5cf6,#00e5ff)", color:"#fff", fontWeight:"700", cursor:"pointer", fontSize:"13px" }}>⚡ Stake NFT</button>
                    <button onClick={()=>showAlert("No rewards yet. Stake an NFT to start earning.","info","No Rewards","🎁")} style={{ padding:"10px 20px", borderRadius:"10px", border:"1px solid rgba(0,229,255,0.3)", background:"rgba(0,229,255,0.08)", color:"#00e5ff", fontWeight:"700", cursor:"pointer", fontSize:"13px" }}>🎁 Claim Rewards</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SWAP ── */}
        {view === "swap" && (
          <div className="page-section animate">
            <h2>🔄 Swap Tokens</h2>
            <div className="swap-box" style={{ maxWidth:"440px" }}>
              <p style={{ color:"#8892a4", fontSize:"13px", marginBottom:"20px" }}>Swap ETH ↔ WETH at 1:1 rate. Instant, no slippage.</p>
              <label style={{ fontSize:"11px", color:"#4a5568", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.09em", display:"block", marginBottom:"6px" }}>You Pay (ETH)</label>
              <input
                placeholder="0.00" type="number" min="0" step="0.001"
                value={swapAmount}
                onChange={e => setSwapAmount(e.target.value)}
                style={{ marginBottom:"8px", fontSize:"22px", fontFamily:"'JetBrains Mono',monospace", fontWeight:"600" }}
              />
              <div style={{ textAlign:"center", fontSize:"22px", margin:"8px 0", color:"#00e5ff", cursor:"pointer" }} onClick={()=>setSwapAmount("")}>⇅</div>
              <label style={{ fontSize:"11px", color:"#4a5568", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.09em", display:"block", marginBottom:"6px" }}>You Receive (WETH)</label>
              <input
                value={swapAmount ? parseFloat(swapAmount).toFixed(4) : ""}
                placeholder="0.00" readOnly
                style={{ marginBottom:"8px", fontSize:"22px", fontFamily:"'JetBrains Mono',monospace", fontWeight:"600", opacity:0.75 }}
              />
              {swapAmount && (
                <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 14px", background:"rgba(0,229,255,0.05)", borderRadius:"10px", marginBottom:"14px", fontSize:"12px", color:"#8892a4" }}>
                  <span>Rate</span><span style={{ color:"#00e5ff", fontFamily:"monospace" }}>1 ETH = 1 WETH</span>
                  <span>Fee</span><span style={{ color:"#f0b429", fontFamily:"monospace" }}>~0.001 ETH</span>
                </div>
              )}
              <button
                onClick={()=> wallet ? showAlert("Swap executes on-chain. Coming live on Sepolia soon!", "info", "Swap Queued", "🔄") : showAlert("Connect your wallet first.", "warning", "Wallet Required", "🔗")}
                style={{ width:"100%", padding:"13px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#00e5ff,#38bdf8)", color:"#04050a", fontWeight:"800", fontSize:"15px", cursor:"pointer", opacity: swapAmount && parseFloat(swapAmount) > 0 ? 1 : 0.5 }}
              >Swap ETH → WETH</button>
              <button onClick={()=>window.open("https://buy.moonpay.com","_blank")} style={{ width:"100%", marginTop:"10px", padding:"11px", borderRadius:"12px", border:"1px solid rgba(0,229,255,0.28)", background:"transparent", color:"#00e5ff", fontWeight:"700", fontSize:"14px", cursor:"pointer" }}>💳 Buy Crypto with Card</button>
            </div>
          </div>
        )}

        {/* ── DROPS ── */}
        {view === "drops" && (
          <DropView onAlert={showAlert} />
        )}

        {/* ── ACTIVITY ── */}
        {view === "activity" && (
          <ActivityView marketNFTs={marketNFTs} savedNFTs={savedNFTs} wallet={wallet} onSelectNFT={setSelectedCollection} />
        )}

        {view === "rewards" && <LootboxView wallet={wallet} authUser={authUser} mintNFTFromLoot={mintNFTFromLoot} />}

        {/* ── STUDIO ── */}
        {view === "studio" && (
          <StudioView authUser={authUser} wallet={wallet} onAlert={showAlert} onMint={() => setView("create")} />
        )}

        {/* ── COLLECTIONS ── */}
        {view === "collections" && !loading && (
          <div className="page-section animate">
            <h2>📦 Top Collections</h2>
            {(() => {
              const prices = marketNFTs.map(n => parseFloat(ethers.formatEther(n.price)));
              const floor = prices.length ? Math.min(...prices).toFixed(4) : "—";
              const volume = prices.reduce((s,p) => s+p, 0).toFixed(3);
              const unique = new Set(marketNFTs.map(n => n.seller?.toLowerCase())).size;
              return (
                <div className="stats-bar" style={{ marginBottom:"28px" }}>
                  <div><h4>Floor Price</h4><p>{floor} {floor !== "—" ? "ETH" : ""}</p></div>
                  <div><h4>Total Volume</h4><p>{volume} ETH</p></div>
                  <div><h4>Listed NFTs</h4><p>{marketNFTs.length}</p></div>
                  <div><h4>Unique Sellers</h4><p>{unique}</p></div>
                </div>
              );
            })()}
            {marketNFTs.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px", color:"#64748b" }}>
                <p style={{ fontSize:"3rem" }}>🖼️</p>
                <p style={{ fontSize:"16px" }}>No NFTs listed yet. Be the first to mint!</p>
                <button onClick={() => setView("create")} style={{ marginTop:"16px", padding:"11px 28px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#00e5ff,#38bdf8)", color:"#04050a", fontWeight:"800", cursor:"pointer", fontSize:"14px" }}>🎨 Mint First NFT</button>
              </div>
            ) : (
              <div className="grid">
                {marketNFTs.map((nft,i) => (
                  <div key={i} className="nft-card" onClick={() => setSelectedCollection(nft)} style={{ cursor:"pointer" }}>
                    <img src={nft.image} alt="" />
                    <h3>{nft.name}</h3>
                    <p>{ethers.formatEther(nft.price)} ETH</p>
                    <span style={{ fontSize:"11px", color:"#7B61FF", background:"rgba(123,97,255,0.1)", padding:"2px 8px", borderRadius:"20px" }}>{nft.category}</span>
                    {nft.seller && <p style={{ margin:"4px 14px 10px", fontFamily:"monospace", fontSize:"10px", color:"#4a5568" }}>👤 {nft.seller.slice(0,8)}...{nft.seller.slice(-4)}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── RESOURCES ── */}
        {view === "resources" && (
          <div className="page-section animate">
            <h2>📚 Resources</h2>
            <p style={{ color:"#94a3b8", fontSize:"14px", marginBottom:"32px" }}>Everything you need to get started with NFTs and blockchain.</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"16px" }}>
              {[
                { icon:"📖", title:"What is an NFT?", desc:"Learn the basics of Non-Fungible Tokens, how they work and why they have value.", link:"https://ethereum.org/en/nft/" },
                { icon:"🦊", title:"MetaMask Guide", desc:"How to set up MetaMask, add networks, and connect to dApps safely.", link:"https://metamask.io/learn/" },
                { icon:"🔷", title:"Ethereum Docs", desc:"Official Ethereum developer documentation for smart contracts and more.", link:"https://ethereum.org/en/developers/docs/" },
                { icon:"📌", title:"Pinata IPFS", desc:"How to store NFT metadata and images on IPFS using Pinata.", link:"https://docs.pinata.cloud/" },
                { icon:"⚒️", title:"Hardhat Guide", desc:"Build, test and deploy smart contracts with the Hardhat framework.", link:"https://hardhat.org/docs" },
                { icon:"🛡️", title:"Staying Safe", desc:"How to avoid scams, protect your wallet and keep your NFTs secure.", link:"https://support.metamask.io/hc/en-us/articles/360015489591" },
              ].map((r, i) => (
                <div key={i} onClick={() => window.open(r.link,"_blank")} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"16px", padding:"22px", cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(123,97,255,0.4)"; e.currentTarget.style.transform="translateY(-4px)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(255,255,255,0.07)"; e.currentTarget.style.transform="translateY(0)"; }}>
                  <div style={{ fontSize:"2rem", marginBottom:"12px" }}>{r.icon}</div>
                  <h3 style={{ fontSize:"15px", fontWeight:"700", marginBottom:"8px", color:"#f1f5f9" }}>{r.title}</h3>
                  <p style={{ color:"#64748b", fontSize:"13px", lineHeight:1.5, marginBottom:"12px" }}>{r.desc}</p>
                  <span style={{ fontSize:"12px", color:"#7B61FF", fontWeight:"600" }}>Read more →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HELP CENTER ── */}
        {view === "help" && (
          <HelpView />
        )}

        {view === "create" && !loading && (
          <div className="card animate" style={{ maxWidth:"600px" }}>
            <h2>🎨 Mint NFT</h2>

            {/* IMAGE UPLOAD + PREVIEW */}
            <div
              onClick={() => document.getElementById("nft-file-input").click()}
              style={{
                width:"100%", height:"200px", borderRadius:"14px",
                border: imagePreview ? "none" : "2px dashed rgba(0,229,255,0.3)",
                background: imagePreview ? "transparent" : "rgba(0,229,255,0.04)",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", marginBottom:"16px", overflow:"hidden",
                transition:"all 0.2s", position:"relative"
              }}
              onMouseEnter={e => { if(!imagePreview) e.currentTarget.style.borderColor="rgba(0,229,255,0.6)"; }}
              onMouseLeave={e => { if(!imagePreview) e.currentTarget.style.borderColor="rgba(0,229,255,0.3)"; }}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"14px" }} />
                  <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:"opacity 0.2s", borderRadius:"14px" }}
                    onMouseEnter={e => e.currentTarget.style.opacity=1}
                    onMouseLeave={e => e.currentTarget.style.opacity=0}>
                    <span style={{ color:"#fff", fontWeight:"700", fontSize:"14px" }}>📷 Change Image</span>
                  </div>
                </>
              ) : (
                <div style={{ textAlign:"center", color:"#4a5568" }}>
                  <p style={{ fontSize:"2.5rem", marginBottom:"8px" }}>🖼️</p>
                  <p style={{ fontSize:"14px", color:"#8892a4", fontWeight:"600" }}>Click to upload image</p>
                  <p style={{ fontSize:"12px", marginTop:"4px" }}>PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
            </div>
            <input
              id="nft-file-input"
              type="file"
              accept="image/*"
              style={{ display:"none" }}
              onChange={(e) => {
                const f = e.target.files[0];
                if (f) {
                  setFile(f);
                  setImagePreview(URL.createObjectURL(f));
                }
              }}
            />

            {/* NAME */}
            <div style={{ position:"relative", marginBottom:"2px" }}>
              <input
                value={nftName}
                placeholder="NFT Name *"
                maxLength={60}
                onChange={(e) => setNftName(e.target.value)}
                style={{ paddingRight:"50px" }}
              />
              <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"11px", color: nftName.length > 50 ? "#f0b429" : "#4a5568", fontFamily:"monospace" }}>{nftName.length}/60</span>
            </div>

            {/* DESCRIPTION */}
            <div style={{ position:"relative", marginBottom:"2px" }}>
              <textarea
                value={description}
                placeholder="Description (optional)"
                maxLength={300}
                onChange={(e) => setDescription(e.target.value)}
                style={{ paddingRight:"50px", marginBottom:"0" }}
              />
              <span style={{ position:"absolute", right:"12px", top:"12px", fontSize:"11px", color: description.length > 250 ? "#f0b429" : "#4a5568", fontFamily:"monospace" }}>{description.length}/300</span>
            </div>

            {/* CATEGORY + PRICE ROW */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginTop:"2px" }}>
              <select value={nftCategory} onChange={(e) => setNftCategory(e.target.value)} style={{ margin:0 }}>
                <option value="Gaming">🎮 Gaming</option>
                <option value="Art">🎨 Art</option>
                <option value="Music">🎵 Music</option>
                <option value="Photography">📷 Photography</option>
                <option value="Sports">⚽ Sports</option>
                <option value="Collectible">💎 Collectible</option>
              </select>
              <div style={{ position:"relative" }}>
                <input
                  value={price}
                  placeholder="Price in ETH *"
                  type="number"
                  min="0"
                  step="0.001"
                  onChange={(e) => setPrice(e.target.value)}
                  style={{ paddingRight:"42px", margin:0 }}
                />
                <span style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"12px", color:"#4a5568", fontWeight:"700" }}>ETH</span>
              </div>
            </div>

            {/* LISTING FEE INFO */}
            <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 14px", background:"rgba(240,180,41,0.07)", border:"1px solid rgba(240,180,41,0.2)", borderRadius:"10px", marginTop:"14px", marginBottom:"4px" }}>
              <span style={{ fontSize:"14px" }}>ℹ️</span>
              <p style={{ margin:0, fontSize:"12px", color:"#f0b429" }}>A listing fee of <strong>0.01 ETH</strong> is charged by the smart contract on mint.</p>
            </div>

            <button onClick={mintNFT} style={{ marginTop:"14px", opacity: !file || !nftName || !price ? 0.6 : 1 }}>
              {!wallet ? "🔗 Connect Wallet to Mint" : !file ? "📷 Add Image to Continue" : !nftName ? "✏️ Add Name to Continue" : !price ? "💰 Add Price to Continue" : "🚀 Mint NFT"}
            </button>
          </div>
        )}

        {view === "profile" && !loading && (
          <div className="profile-page animate">
            {!authUser ? (
              <div style={{ textAlign:"center", padding:"80px 40px", color:"#64748b" }}>
                <p style={{ fontSize:"4rem" }}>👤</p>
                <h2 style={{ color:"#e2e8f0", marginTop:"16px" }}>Not logged in</h2>
                <p style={{ marginTop:"8px", fontSize:"14px" }}>Login to view your profile and assets.</p>
                <button onClick={() => setView("login")} style={{ marginTop:"20px", padding:"11px 32px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#7B61FF,#00f6ff)", color:"#fff", fontWeight:"700", cursor:"pointer" }}>Login</button>
              </div>
            ) : (
              <>
                {/* BANNER & AVATAR */}
                <div style={{ position:"relative" }}>
                  {profile?.banner
                    ? <img src={profile.banner} className="profile-banner" alt="banner" />
                    : <div style={{ width:"100%", height:"180px", background:"linear-gradient(135deg,#1e1b4b,#0f172a,#1e293b)" }} />
                  }
                </div>
                {profile?.avatar
                  ? <img src={profile.avatar} className="profile-avatar" alt="avatar" />
                  : <div style={{ width:"90px", height:"90px", borderRadius:"50%", background:"linear-gradient(135deg,#7B61FF,#00f6ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"2.2rem", marginTop:"-45px", marginLeft:"32px", border:"4px solid #06080f", position:"relative", zIndex:2 }}>👤</div>
                }

                {/* NAME + WALLET */}
                <div style={{ padding:"12px 32px 0" }}>
                  <h2 style={{ fontSize:"22px", fontWeight:"700", margin:"0 0 4px", color:"#f1f5f9" }}>{profile?.username || authUser.name || "Anonymous"}</h2>
                  {wallet && <p style={{ fontFamily:"monospace", fontSize:"12px", color:"#64748b", margin:"0 0 6px" }}>{wallet.slice(0,10)}...{wallet.slice(-6)}</p>}
                  {profile?.bio && <p style={{ color:"#94a3b8", fontSize:"13px", margin:"0 0 10px", lineHeight:1.6 }}>{profile.bio}</p>}
                  <div style={{ display:"flex", gap:"12px", marginBottom:"20px", flexWrap:"wrap" }}>
                    {profile?.twitter && <a href={`https://twitter.com/${profile.twitter.replace("@","")}`} target="_blank" rel="noreferrer" style={{ color:"#1d9bf0", fontSize:"13px", textDecoration:"none" }}>🐦 {profile.twitter}</a>}
                    {profile?.instagram && <a href={`https://instagram.com/${profile.instagram.replace("@","")}`} target="_blank" rel="noreferrer" style={{ color:"#e1306c", fontSize:"13px", textDecoration:"none" }}>📸 {profile.instagram}</a>}
                    {profile?.discord && <span style={{ color:"#7289da", fontSize:"13px" }}>💬 {profile.discord}</span>}
                  </div>
                </div>

                {/* STATS ROW */}
                <div style={{ display:"flex", gap:"12px", padding:"0 32px 24px", flexWrap:"wrap" }}>
                  {[
                    ["NFTs Owned", savedNFTs.length, "#00f6ff"],
                    ["Minted", savedNFTs.filter(n => n.seller?.toLowerCase() === wallet?.toLowerCase()).length, "#7B61FF"],
                    ["Total Value", savedNFTs.reduce((s,n) => s + parseFloat(n.price||0), 0).toFixed(3) + " ETH", "#f59e0b"],
                    ["Favorites", Object.values(likes).filter(Boolean).length, "#ef4444"],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"14px 22px", flex:1, minWidth:"110px", textAlign:"center" }}>
                      <p style={{ margin:"0 0 4px", color:"#64748b", fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</p>
                      <p style={{ margin:0, color, fontSize:"20px", fontWeight:"700", fontFamily:"monospace" }}>{val}</p>
                    </div>
                  ))}
                </div>

                <h3 style={{ margin:"0 32px 16px", fontSize:"12px", fontWeight:"700", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.1em", borderLeft:"3px solid #00f6ff", paddingLeft:"10px" }}>Your Assets</h3>

                {!wallet ? (
                  <div style={{ padding:"0 32px" }}>
                    <p style={{ color:"#64748b", marginBottom:"14px" }}>Connect your wallet to see your on-chain NFTs.</p>
                    <button onClick={connectWallet} style={{ padding:"10px 24px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#7B61FF,#00f6ff)", color:"#fff", fontWeight:"700", cursor:"pointer" }}>Connect Wallet</button>
                  </div>
                ) : savedNFTs.length === 0 ? (
                  <div style={{ padding:"40px 32px", textAlign:"center", color:"#64748b" }}>
                    <p style={{ fontSize:"2.5rem" }}>🖼️</p>
                    <p style={{ marginTop:"12px" }}>No NFTs yet. Mint or buy some!</p>
                    <button onClick={() => setView("create")} style={{ marginTop:"16px", padding:"10px 24px", borderRadius:"10px", border:"none", background:"linear-gradient(135deg,#7B61FF,#00f6ff)", color:"#fff", fontWeight:"700", cursor:"pointer" }}>Mint Your First NFT</button>
                  </div>
                ) : (
                  <div className="grid" style={{ padding:"0 28px 40px" }}>
                    {savedNFTs.map((nft,i) => (
                      <div key={i} className="nft-card">
                        <img src={nft.image} alt={nft.name} onClick={() => setSelectedCollection(nft)} style={{ cursor:"pointer" }} />
                        <h3>{nft.name}</h3>
                        <p>{nft.price} ETH</p>
                        <span style={{ fontSize:"11px", color:"#7B61FF", background:"rgba(123,97,255,0.1)", padding:"2px 8px", borderRadius:"20px" }}>{nft.category}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {view === "settings" && (
          <div className="page-section animate">
            <h2>⚙️ Profile Settings</h2>
            {!authUser ? (
              <div style={{ textAlign:"center", padding:"60px", color:"#64748b" }}>
                <p style={{ fontSize:"3rem" }}>🔒</p>
                <p style={{ fontSize:"16px", marginTop:"12px" }}>Please login to edit your profile.</p>
              </div>
            ) : (
            <div className="profile-settings">
              {/* PREVIEW */}
              {(profile?.avatar || profile?.banner) && (
                <div style={{ marginBottom:"24px", borderRadius:"16px", overflow:"hidden", border:"1px solid rgba(255,255,255,0.07)" }}>
                  {profile.banner && <img src={profile.banner} alt="banner" style={{ width:"100%", height:"120px", objectFit:"cover", display:"block" }} />}
                  <div style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
                    {profile.avatar && <img src={profile.avatar} alt="avatar" style={{ width:"52px", height:"52px", borderRadius:"50%", objectFit:"cover", border:"3px solid rgba(0,246,255,0.3)" }} />}
                    <div>
                      <p style={{ margin:0, fontWeight:"700", color:"#e2e8f0" }}>{profile.username || "No username yet"}</p>
                      <p style={{ margin:"2px 0 0", fontSize:"12px", color:"#64748b" }}>{profile.bio || "No bio yet"}</p>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" }}>
                <div className="banner-upload"><label>📷 Upload Banner</label><input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files[0])} /></div>
                <div className="avatar-upload"><label>🖼️ Upload Avatar</label><input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} /></div>
              </div>

              <label style={{ fontSize:"12px", color:"#64748b", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your display name" style={{ marginBottom:"14px" }} />

              <label style={{ fontSize:"12px", color:"#64748b", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell the world about yourself..." style={{ height:"90px", resize:"vertical", marginBottom:"14px", width:"100%", padding:"12px", borderRadius:"10px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#e2e8f0", fontFamily:"inherit", outline:"none" }}></textarea>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"14px" }}>
                <div>
                  <label style={{ fontSize:"12px", color:"#64748b", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>🐦 Twitter</label>
                  <input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="@username" />
                </div>
                <div>
                  <label style={{ fontSize:"12px", color:"#64748b", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>📸 Instagram</label>
                  <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@username" />
                </div>
              </div>

              <label style={{ fontSize:"12px", color:"#64748b", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>💬 Discord</label>
              <input value={discord} onChange={e => setDiscord(e.target.value)} placeholder="username#0000" style={{ marginBottom:"14px" }} />

              <label style={{ fontSize:"12px", color:"#64748b", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.07em", display:"block", marginBottom:"6px" }}>🔗 Wallet Address</label>
              <input value={wallet || "Not connected"} readOnly style={{ marginBottom:"20px", opacity:0.6, cursor:"default" }} />

              <button onClick={saveProfile} style={{ width:"100%", padding:"13px", borderRadius:"12px", border:"none", background:"linear-gradient(135deg,#00f6ff,#7B61FF)", color:"#fff", fontWeight:"700", fontSize:"15px", cursor:"pointer" }}>
                💾 Save Profile
              </button>

              <div style={{ marginTop:"32px", borderTop:"1px solid rgba(239,68,68,0.2)", paddingTop:"24px" }}>
                <h3 style={{ color:"#ef4444", marginBottom:"8px", fontSize:"15px" }}>⚠️ Danger Zone</h3>
                <p style={{ color:"#94a3b8", fontSize:"13px", marginBottom:"14px" }}>Permanently delete all your saved NFTs. Cannot be undone.</p>
                <button
                  onClick={() => {
                    if (!authUser) return showAlert("Please login first.", "warning", "Login Required", "🔐");
                    showConfirm(
                      "This will permanently delete ALL your saved NFTs from the database. This cannot be undone.",
                      async () => {
                        try { const res = await axios.delete(`${API}/api/nfts/clear/${authUser.email}`); setSavedNFTs([]); showToast("info", res.data.message); }
                        catch(e) { showAlert(e.response?.data?.error || e.message, "error", "Error"); }
                      },
                      "Delete All NFTs", "Delete All", "error"
                    );
                  }}
                  style={{ background:"rgba(239,68,68,0.1)", color:"#ef4444", border:"1px solid rgba(239,68,68,0.3)", padding:"10px 24px", borderRadius:"8px", cursor:"pointer", fontWeight:"700", fontSize:"13px" }}
                >
                  🗑️ Clear All My NFTs
                </button>
              </div>
            </div>
            )}
          </div>
        )}

        {publicProfileWallet && !loading && <PublicProfileView wallet={publicProfileWallet} onBack={() => setPublicProfileWallet(null)} API={API} currentWallet={wallet} />}
        {selectedCollection && !loading && <NFTDetailView nft={selectedCollection} wallet={wallet} authUser={authUser} onBack={() => setSelectedCollection(null)} onBuy={buyNFT} onUnlist={unlistNFT} API={API} />}

        {view === "login" && (
          <div className="auth-modal"><div className="auth-box">
            <h2>Login</h2>
            <input
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <button onClick={login}>Enter App</button>
            <button className="close-btn" onClick={() => setView("market")}>Cancel</button>
          </div></div>
        )}

        {view === "register" && (
          <div className="page-section animate">
            <h2>📝 Create Account</h2>
            <div className="activity-box" style={{ maxWidth:"460px" }}>
              <div className="form-group">
                <label>Username</label>
                <input type="text" placeholder="Your display name" autoComplete="username" onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="your@email.com" autoComplete="email" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key==="Enter" && register()} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="Min 6 characters" autoComplete="new-password" onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key==="Enter" && register()} />
              </div>
              <button className="connect-btn-large" style={{ marginTop:"20px", background:"linear-gradient(135deg,#00e5ff,#38bdf8)", color:"#04050a" }} onClick={register}>
                Create Account
              </button>
              <p style={{ marginTop:"16px", textAlign:"center", color:"#4a5568", fontSize:"13px" }}>
                Already have an account?{" "}
                <span onClick={() => setView("login")} style={{ color:"#00e5ff", cursor:"pointer", fontWeight:"600" }}>Sign In</span>
              </p>
            </div>
          </div>
        )}

      </div>
    </div>

    <Toast toasts={toasts} removeToast={removeToast} />
    <Modal modal={modal} onClose={() => setModal(null)} onConfirm={modal?.onConfirm} />
    <style>{`
      @keyframes slideIn { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
    `}</style>
    </>
  );
}

export default App;