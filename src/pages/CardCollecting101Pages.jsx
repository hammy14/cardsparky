import AffiliateCard from '../components/AffiliateCard';
import { useAffiliateCards } from '../hooks/useAffiliateCards';

export function GettingStarted() {
  return (
    <div className="article">
      <div className="article-hero">
        <h1>🃏 Getting Started</h1>
        <p>Welcome to the hobby! Trading card collecting is one of the fastest-growing hobbies in the world. Whether you're chasing your favorite athlete or hunting rare parallels, this guide will help you hit the ground running.</p>
      </div>
      <div className="callout callout-tip"><strong>💡 Tip:</strong> Start with a sport or player you're passionate about — it makes the hobby more fun and keeps you focused.</div>
      <h2>Step 1: Pick Your Focus</h2>
      <p>The hobby is massive. Narrowing your focus early saves money and builds a more meaningful collection. Common starting points:</p>
      <ul>
        <li>A favorite sport (NFL, NBA, MLB, NHL, Soccer)</li>
        <li>A specific player or team</li>
        <li>A specific era (vintage vs. modern)</li>
        <li>A specific card type (rookies, autos, relics)</li>
      </ul>
      <h2>Step 2: Set a Budget</h2>
      <p>You can start collecting for as little as $20–$50. Buying singles (individual cards) is the most budget-friendly way to build a collection versus buying packs or boxes.</p>
      <div className="callout callout-warn"><strong>⚠️ Warning:</strong> Pack buying is exciting but statistically expensive. Most collectors recommend buying singles once you know what you want.</div>
      <h2>Step 3: Learn the Basics</h2>
      <p>Familiarize yourself with key terms: rookie cards, parallels, serial numbers, grading, and print runs. The rest of the Card Collecting 101 tabs cover each of these in detail.</p>
      <h2>Step 4: Store Your Cards Properly</h2>
      <p>From day one, protect your cards. Use penny sleeves and top loaders for valuable cards. See the <em>Storing Your Cards</em> tab for a full breakdown.</p>
      <div className="callout"><strong>📌 Remember:</strong> The hobby should be fun. Collect what you love, not just what's trending.</div>
    </div>
  );
}

export function TypesOfCards() {
  return (
    <div className="article">
      <div className="article-hero">
        <h1>📦 Types of Cards</h1>
        <p>Not all trading cards are created equal. Understanding the different types helps you know what you're buying, what's valuable, and what to chase.</p>
      </div>
      <div className="info-grid">
        <div className="info-card"><div className="info-card-icon">⭐</div><h3>Base Cards</h3><p>The standard cards in any set. High print runs, widely available, and great for player collectors.</p></div>
        <div className="info-card"><div className="info-card-icon">🏆</div><h3>Rookie Cards (RC)</h3><p>A player's first officially licensed card. Often the most valuable cards in any set.</p></div>
        <div className="info-card"><div className="info-card-icon">✍️</div><h3>Autographs</h3><p>Cards signed by the player, either on-card or via a sticker. On-card autos are more desirable.</p></div>
        <div className="info-card"><div className="info-card-icon">👕</div><h3>Relics / Patches</h3><p>Cards containing a piece of game-used or player-worn memorabilia embedded in the card.</p></div>
        <div className="info-card"><div className="info-card-icon">🌈</div><h3>Parallels</h3><p>Alternate versions of base cards with different colors, finishes, or serial numbers. Often rarer and more valuable.</p></div>
        <div className="info-card"><div className="info-card-icon">💎</div><h3>Inserts</h3><p>Special cards included in packs that aren't part of the base set. Usually feature unique designs or themes.</p></div>
        <div className="info-card"><div className="info-card-icon">🔢</div><h3>Numbered Cards</h3><p>Cards with a printed serial number (e.g. /25 or /10) indicating how many were made. Lower = rarer.</p></div>
        <div className="info-card"><div className="info-card-icon">1️⃣</div><h3>1-of-1s (Superfractors)</h3><p>The rarest cards — only one exists in the world. The holy grail for many collectors.</p></div>
      </div>
      <div className="callout callout-tip"><strong>💡 Tip:</strong> When buying, always check if a card is a base, parallel, or insert — it makes a huge difference in value.</div>
    </div>
  );
}

export function RookieCard() {
  return (
    <div className="article">
      <div className="article-hero">
        <h1>🌟 What is a Rookie Card?</h1>
        <p>The rookie card is the crown jewel of sports card collecting. Understanding what qualifies as a true rookie card is essential for every collector.</p>
      </div>
      <h2>The Official Definition</h2>
      <p>A rookie card (RC) is a player's first officially licensed trading card produced during or after their first professional season. Major manufacturers like Topps, Panini, and Upper Deck mark these with an official <strong>RC logo</strong>.</p>
      <div className="callout callout-warn"><strong>⚠️ Important:</strong> Not every card of a young player is a rookie card. Cards produced before the official RC logo era (pre-2006) or unlicensed cards do not carry the RC designation.</div>
      <h2>Why Are Rookie Cards So Valuable?</h2>
      <ul>
        <li>They represent the beginning of a player's career</li>
        <li>If the player becomes a star, demand skyrockets</li>
        <li>Limited supply compared to later career cards</li>
        <li>Graded rookie cards of legends can sell for millions</li>
      </ul>
      <h2>Short Prints & Rookie Variations</h2>
      <p>Many sets include short print (SP) rookie variations — alternate photos or designs with lower print runs. These are highly sought after and often command significant premiums.</p>
      <h2>Key Rookie Cards in History</h2>
      <div className="info-grid">
        <div className="info-card"><div className="info-card-icon">🏀</div><h3>LeBron James</h3><p>2003-04 Topps Chrome RC — one of the most iconic modern rookie cards.</p></div>
        <div className="info-card"><div className="info-card-icon">⚾</div><h3>Mike Trout</h3><p>2011 Topps Update RC — the benchmark for modern baseball rookie cards.</p></div>
        <div className="info-card"><div className="info-card-icon">🏈</div><h3>Patrick Mahomes</h3><p>2017 Panini Prizm RC — one of the most popular modern football rookies.</p></div>
      </div>
      <div className="callout callout-tip"><strong>💡 Tip:</strong> Always verify the RC logo when buying rookie cards. "Year 2" cards of popular players are often mistaken for rookies.</div>
    </div>
  );
}

export function BrandsManufacturers() {
  return (
    <div className="article">
      <div className="article-hero">
        <h1>🏭 Brands & Manufacturers</h1>
        <p>A handful of major manufacturers dominate the trading card industry. Each has exclusive licenses for certain sports and produces a wide range of products at different price points.</p>
      </div>
      <div className="info-grid">
        <div className="info-card"><div className="info-card-icon">⚾</div><h3>Topps</h3><p>The oldest and most iconic brand. Holds the exclusive MLB license. Known for Topps Chrome, Bowman, and Stadium Club.</p></div>
        <div className="info-card"><div className="info-card-icon">🏀</div><h3>Panini</h3><p>Dominates NBA, NFL, and college sports. Known for Prizm, Select, National Treasures, and Mosaic.</p></div>
        <div className="info-card"><div className="info-card-icon">🏒</div><h3>Upper Deck</h3><p>Holds the exclusive NHL license. Also produces non-sport cards. Known for SP Authentic and Young Guns.</p></div>
        <div className="info-card"><div className="info-card-icon">⚽</div><h3>Topps (Soccer)</h3><p>Produces UEFA Champions League and other soccer sets. Chrome and Match Attax are popular lines.</p></div>
        <div className="info-card"><div className="info-card-icon">🎮</div><h3>Fanatics / Topps</h3><p>Fanatics acquired Topps and is expanding into new sports and digital collectibles.</p></div>
        <div className="info-card"><div className="info-card-icon">🃏</div><h3>Leaf</h3><p>Independent manufacturer known for autograph-heavy products and multi-sport releases.</p></div>
      </div>
      <h2>Product Tiers</h2>
      <p>Most manufacturers release products across three tiers:</p>
      <ul>
        <li><strong>Entry Level</strong> — Affordable packs ($5–$30/box). Examples: Topps Series 1, Panini Donruss</li>
        <li><strong>Mid Range</strong> — Better hits, more parallels ($50–$150/box). Examples: Prizm, Chrome</li>
        <li><strong>High End</strong> — Premium autos and patches ($200–$1,000+/box). Examples: National Treasures, Flawless</li>
      </ul>
      <div className="callout callout-tip"><strong>💡 Tip:</strong> Stick to licensed products from major manufacturers for the best resale value and authenticity guarantees.</div>
    </div>
  );
}

export function CardGrading() {
  const { cards } = useAffiliateCards('grading');
  return (
    <div className="article">
      <div className="article-hero">
        <h1>🔬 Card Grading</h1>
        <p>Card grading is the process of having a professional company evaluate and assign a numeric grade to your card based on its condition. A graded card is sealed in a tamper-evident case called a "slab."</p>
      </div>
      <h2>Why Grade Cards?</h2>
      <ul>
        <li>Authenticates the card and protects against counterfeits</li>
        <li>Preserves the card in a protective case</li>
        <li>Higher grades significantly increase value</li>
        <li>Makes buying/selling easier with a standardized condition</li>
      </ul>
      <h2>PSA Grading Scale</h2>
      <table className="grade-table">
        <thead><tr><th>Grade</th><th>Label</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>PSA 10</td><td>Gem Mint</td><td>Perfect card. Four sharp corners, no print defects, centered.</td></tr>
          <tr><td>PSA 9</td><td>Mint</td><td>Nearly perfect with only minor imperfections.</td></tr>
          <tr><td>PSA 8</td><td>Near Mint-Mint</td><td>Slight wear on corners or edges. Still very clean.</td></tr>
          <tr><td>PSA 7</td><td>Near Mint</td><td>Light wear visible. No creases or stains.</td></tr>
          <tr><td>PSA 6</td><td>Excellent-Mint</td><td>Minor rounding on corners, slight surface wear.</td></tr>
          <tr><td>PSA 5</td><td>Excellent</td><td>Noticeable wear but no major defects.</td></tr>
          <tr><td>PSA 4 and below</td><td>Very Good or lower</td><td>Significant wear, creases, or damage.</td></tr>
        </tbody>
      </table>
      <h2>Top Grading Companies</h2>
      <div className="info-grid">
        <div className="info-card"><div className="info-card-icon">🥇</div><h3>PSA</h3><p>Professional Sports Authenticator. The most recognized and trusted grading company. Highest resale premiums.</p></div>
        <div className="info-card"><div className="info-card-icon">🥈</div><h3>BGS (Beckett)</h3><p>Known for subgrades (centering, corners, edges, surface). BGS 9.5 Black Label is highly coveted.</p></div>
        <div className="info-card"><div className="info-card-icon">🥉</div><h3>SGC</h3><p>Faster turnaround times, growing in popularity especially for vintage cards.</p></div>
      </div>
      <div className="callout callout-warn"><strong>⚠️ Note:</strong> Grading fees range from $20 to $300+ per card depending on service level and turnaround time. Only grade cards where the value justifies the cost.</div>
      <div className="callout callout-tip"><strong>💡 Tip:</strong> A PSA 10 can be worth 5–10x more than an ungraded copy of the same card.</div>
      <h2>Grade Your Cards</h2>
      {cards.length > 0 && <>
        <p className="affiliate-disclosure">We may earn a commission from links below at no extra cost to you.</p>
        <div className="affiliate-grid">
          {cards.map(c => <AffiliateCard key={c.id} {...c} />)}
        </div>
      </>}
    </div>
  );
}

export function DetermineValue() {
  return (
    <div className="article">
      <div className="article-hero">
        <h1>💰 How to Determine Value</h1>
        <p>Card values fluctuate constantly based on player performance, market trends, and card scarcity. Here's how to research what your cards are actually worth.</p>
      </div>
      <h2>Check Recent Sales (Comps)</h2>
      <p>The most reliable way to value a card is to look at recent sold listings — called "comps" (comparables). Always use sold prices, not asking prices.</p>
      <div className="info-grid">
        <div className="info-card"><div className="info-card-icon">🛒</div><h3>eBay Sold Listings</h3><p>Filter by "Sold Items" on eBay. The gold standard for finding real market value.</p></div>
        <div className="info-card"><div className="info-card-icon">📊</div><h3>130point.com</h3><p>Aggregates eBay sold data with charts and price history. Great for tracking trends.</p></div>
        <div className="info-card"><div className="info-card-icon">💳</div><h3>PWCC Market</h3><p>Premium auction platform with historical sales data for high-end cards.</p></div>
        <div className="info-card"><div className="info-card-icon">📱</div><h3>CardLadder</h3><p>Tracks card values over time like a stock market. Great for investment-minded collectors.</p></div>
      </div>
      <h2>Factors That Affect Value</h2>
      <ul>
        <li><strong>Player performance</strong> — Hot players command premiums. Values drop with injuries or poor play.</li>
        <li><strong>Print run / serial number</strong> — Lower numbered cards are worth more.</li>
        <li><strong>Grade</strong> — A PSA 10 can be worth multiples of a raw (ungraded) copy.</li>
        <li><strong>Rookie vs. veteran</strong> — Rookie cards almost always carry the highest premiums.</li>
        <li><strong>On-card auto vs. sticker auto</strong> — On-card signatures are more desirable.</li>
        <li><strong>Centering</strong> — Off-center cards are worth significantly less.</li>
      </ul>
      <div className="callout callout-warn"><strong>⚠️ Warning:</strong> Card values can drop quickly. Never overpay based on hype — always check recent comps first.</div>
      <div className="callout callout-tip"><strong>💡 Tip:</strong> Search the exact card variation (year, set, parallel color, and serial number range) for the most accurate comps.</div>
    </div>
  );
}

export function StoringCards() {
  const { cards } = useAffiliateCards('storing');
  return (
    <div className="article">
      <div className="article-hero">
        <h1>📦 Storing Your Cards</h1>
        <p>Proper storage protects your investment and keeps your cards in top condition. The right supplies make a huge difference, especially for valuable cards.</p>
      </div>
      <h2>Essential Supplies</h2>
      <div className="info-grid">
        <div className="info-card"><div className="info-card-icon">🛡️</div><h3>Penny Sleeves</h3><p>Thin plastic sleeves for every card. First line of defense against scratches. Cost: ~$3 per 100.</p></div>
        <div className="info-card"><div className="info-card-icon">🔒</div><h3>Top Loaders</h3><p>Rigid plastic holders for valuable cards. Use with a penny sleeve inside. Cost: ~$8 per 25.</p></div>
        <div className="info-card"><div className="info-card-icon">📐</div><h3>Card Savers</h3><p>Semi-rigid holders preferred by grading companies (PSA, BGS). Better than top loaders for submission.</p></div>
        <div className="info-card"><div className="info-card-icon">📁</div><h3>Binders & Pages</h3><p>9-pocket pages in a binder are great for base sets and player collections. Use side-loading pages.</p></div>
        <div className="info-card"><div className="info-card-icon">📦</div><h3>Storage Boxes</h3><p>Cardboard or plastic boxes for bulk storage. Available in 100, 800, and 3,200 count sizes.</p></div>
        <div className="info-card"><div className="info-card-icon">💎</div><h3>One-Touch Holders</h3><p>Magnetic screw-down cases for premium display cards. Best for slabs and high-value singles.</p></div>
      </div>
      <h2>Environmental Tips</h2>
      <ul>
        <li>Store cards away from direct sunlight — UV rays cause fading</li>
        <li>Keep humidity below 50% to prevent warping and mold</li>
        <li>Avoid extreme temperature changes</li>
        <li>Never store cards in rubber bands — they cause damage</li>
        <li>Keep slabs (graded cards) in a cool, dry place</li>
      </ul>
      <div className="callout callout-tip"><strong>💡 Tip:</strong> For high-value collections, consider a fireproof safe or safety deposit box for your most prized cards.</div>
      <div className="callout callout-warn"><strong>⚠️ Warning:</strong> Never write on top loaders or use tape directly on cards. It permanently damages them.</div>
      <h2>Shop Supplies</h2>
      {cards.length > 0 && <>
        <p className="affiliate-disclosure">We may earn a commission from links below at no extra cost to you.</p>
        <div className="affiliate-grid">
          {cards.map(c => <AffiliateCard key={c.id} {...c} />)}
        </div>
      </>}
    </div>
  );
}

export function WhereToBuy() {
  return (
    <div className="article">
      <div className="article-hero">
        <h1>🛒 Where to Buy</h1>
        <p>There are more ways than ever to buy trading cards. Each platform has its pros and cons depending on what you're looking for.</p>
      </div>
      <div className="info-grid">
        <div className="info-card"><div className="info-card-icon">🛒</div><h3>eBay</h3><p>The largest marketplace for singles and lots. Great for comps. Watch for fakes on high-value cards.</p></div>
        <div className="info-card"><div className="info-card-icon">📱</div><h3>COMC</h3><p>Check Out My Cards — large inventory of singles at fixed prices. Slow shipping but great selection.</p></div>
        <div className="info-card"><div className="info-card-icon">🤝</div><h3>Facebook Groups</h3><p>Active buying/selling communities. Good deals but requires trust and due diligence.</p></div>
        <div className="info-card"><div className="info-card-icon">🏪</div><h3>Local Card Shops (LCS)</h3><p>Support your local shop! Great for wax (packs/boxes), singles, and community events.</p></div>
        <div className="info-card"><div className="info-card-icon">🎪</div><h3>Card Shows</h3><p>In-person events with dozens of dealers. Best for finding deals and rare vintage cards.</p></div>
        <div className="info-card"><div className="info-card-icon">📦</div><h3>Whatnot</h3><p>Live streaming platform for breaks and auctions. Fun and interactive but can be impulsive.</p></div>
        <div className="info-card"><div className="info-card-icon">🏆</div><h3>PWCC / Goldin</h3><p>Premium auction houses for high-end and vintage cards. Best for serious investments.</p></div>
        <div className="info-card"><div className="info-card-icon">🔄</div><h3>StockX / Alt</h3><p>Authentication-focused platforms for buying and selling graded cards like stocks.</p></div>
      </div>
      <h2>Tips for Buying Safely</h2>
      <ul>
        <li>Always check seller feedback and ratings</li>
        <li>Request additional photos for high-value cards</li>
        <li>Compare prices across multiple platforms before buying</li>
        <li>Be cautious of deals that seem too good to be true</li>
        <li>Use PayPal Goods & Services for buyer protection</li>
      </ul>
      <div className="callout callout-tip"><strong>💡 Tip:</strong> Buying singles on eBay is almost always cheaper than buying packs to pull the same card.</div>
    </div>
  );
}

export function ParallelsInserts() {
  return (
    <div className="article">
      <div className="article-hero">
        <h1>🌈 Parallels vs Inserts</h1>
        <p>Two of the most misunderstood terms in the hobby. Once you understand the difference, navigating card sets becomes much easier.</p>
      </div>
      <div className="compare-grid">
        <div className="compare-card">
          <h3>🌈 Parallels</h3>
          <ul>
            <li>Alternate versions of base cards</li>
            <li>Same design, different color or finish</li>
            <li>Often serial numbered</li>
            <li>Part of the base set checklist</li>
            <li>Examples: Silver Prizm, Gold Refractor, Orange /25</li>
          </ul>
        </div>
        <div className="compare-card">
          <h3>💎 Inserts</h3>
          <ul>
            <li>Completely separate cards from the base set</li>
            <li>Unique design and theme</li>
            <li>May or may not be numbered</li>
            <li>Have their own separate checklist</li>
            <li>Examples: Topps Chrome Black, Panini Mosaic Stained Glass</li>
          </ul>
        </div>
      </div>
      <h2>Parallel Rainbow Chasing</h2>
      <p>Many collectors try to collect every parallel of a single card — this is called "rainbow chasing." A full rainbow can include 10–20+ different versions of the same card ranging from common silvers to 1-of-1 superfractors.</p>
      <h2>Common Parallel Colors (Prizm Example)</h2>
      <table className="grade-table">
        <thead><tr><th>Color</th><th>Print Run</th><th>Rarity</th></tr></thead>
        <tbody>
          <tr><td>Silver Prizm</td><td>Unumbered</td><td>Common</td></tr>
          <tr><td>Blue</td><td>/199</td><td>Uncommon</td></tr>
          <tr><td>Green</td><td>/99</td><td>Rare</td></tr>
          <tr><td>Purple</td><td>/49</td><td>Very Rare</td></tr>
          <tr><td>Orange</td><td>/25</td><td>Super Rare</td></tr>
          <tr><td>Red</td><td>/10</td><td>Ultra Rare</td></tr>
          <tr><td>Gold</td><td>/10</td><td>Ultra Rare</td></tr>
          <tr><td>Black</td><td>/1</td><td>1 of 1</td></tr>
        </tbody>
      </table>
      <div className="callout callout-tip"><strong>💡 Tip:</strong> When searching for a card, always specify the parallel color. A Silver Prizm and a Gold Prizm of the same player can differ in value by 10x or more.</div>
    </div>
  );
}
