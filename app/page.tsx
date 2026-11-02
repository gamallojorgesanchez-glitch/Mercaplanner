"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import type { AppData, Household, PlannedMeal, Product, ShoppingItem } from "@/lib/types";
import { starterRecipes } from "@/lib/recipes";

const initialHousehold: Household = {
  name: "Mi hogar", budget: 450, postalCode: "", adults: 2,
  children: { small: 0, primary: 0, teen: 0 }, priority: "ahorro", cooking: "mixto",
  meals: ["Comida", "Cena"], exclusions: "", allergies: "", essentials: "",
};

const blankData: AppData = {
  household: initialHousehold, products: [], recipes: starterRecipes, menu: [], pantry: [],
  shopping: [], shoppingDates: [], month: new Date().toISOString().slice(0, 7), onboarded: false,
};

const nav = [
  ["inicio", "Inicio", "⌂"], ["hogar", "Mi hogar", "⌂"], ["menu", "Menú mensual", "▦"],
  ["compra", "Lista de compra", "☷"], ["despensa", "Mi despensa", "▤"], ["catalogo", "Catálogo", "⌕"],
] as const;
type Page = (typeof nav)[number][0];

function money(value: number | null) {
  return value === null ? "Sin precio" : new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value);
}
function uuid() { return crypto.randomUUID(); }
function datesInMonth(month: string) {
  const [year, m] = month.split("-").map(Number);
  return Array.from({ length: new Date(year, m, 0).getDate() }, (_, i) => {
    const date = new Date(year, m - 1, i + 1);
    return `${year}-${String(m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
  });
}
function friendlyDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${date}T12:00:00`));
}
function parseAmount(text: string): { amount: number; unit: string } | null {
  const match = text.trim().toLowerCase().match(/^(\d+(?:[.,]\d+)?|½|¼|¾)\s*([a-záéíóúñ]+)?/i);
  if (!match) return null;
  const fraction: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75 };
  const amount = fraction[match[1]] ?? Number(match[1].replace(",", "."));
  const unit = (match[2] ?? "ud").replace(/unidades?/, "ud").replace(/kilogramos?/, "kg").replace(/gramos?/, "g").replace(/litros?/, "l").replace(/mililitros?/, "ml");
  return Number.isFinite(amount) ? { amount, unit } : null;
}
function baseAmount(amount: number, unit: string) {
  if (unit === "kg") return { amount: amount * 1000, unit: "g" };
  if (unit === "l") return { amount: amount * 1000, unit: "ml" };
  return { amount, unit };
}
function printAmount(amount: number, unit: string) {
  const rounded = Math.round(amount * 100) / 100;
  if ((unit === "g" || unit === "ml") && rounded >= 1000) return `${Math.round(rounded / 10) / 100} ${unit === "g" ? "kg" : "l"}`;
  return `${rounded} ${unit}`;
}

export default function Home() {
  const [data, setData] = useState<AppData>(blankData);
  const [page, setPage] = useState<Page>("inicio");
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("mercaplanner.local.v1");
      if (saved) { const parsed = JSON.parse(saved) as Partial<AppData>; setData({ ...blankData, ...parsed, household: { ...initialHousehold, ...parsed.household }, recipes: starterRecipes }); }
    } catch { setMessage("No se pudieron cargar los datos guardados en este navegador."); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem("mercaplanner.local.v1", JSON.stringify(data));
  }, [data, ready]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(timer);
  }, [message]);

  const recipeById = useMemo(() => new Map(data.recipes.map((recipe) => [recipe.id, recipe])), [data.recipes]);
  const estimatedTotal = data.shopping.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const spentTotal = data.shopping.reduce((sum, item) => sum + (item.bought ? (item.paidPrice ?? item.price ?? 0) : 0), 0);
  const nextDate = data.shoppingDates.map((item) => item.date).filter((date) => date >= new Date().toISOString().slice(0, 10)).sort()[0];

  function updateHousehold(patch: Partial<Household>) {
    setData((current) => ({ ...current, household: { ...current.household, ...patch } }));
  }

  function addMeal(date: string, meal: PlannedMeal["meal"], recipeId: string) {
    const recipe = data.recipes.find((item) => item.id === recipeId);
    if (!recipe) return;
    setData((current) => ({ ...current, menu: [...current.menu.filter((item) => !(item.date === date && item.meal === meal)), { id: uuid(), date, meal, recipeId, servings: current.household.adults + current.household.children.small + current.household.children.primary + current.household.children.teen, approved: false }] }));
    setMessage("Plato añadido al menú.");
  }

  function generateMenu() {
    if (data.household.allergies.trim()) { setMessage("Esta versión local no puede validar alergias: no uses su planificación para comidas con alergias declaradas."); return; }
    const days = datesInMonth(data.month);
    const chosenMeals = data.household.meals as PlannedMeal["meal"][];
    const excluded = data.household.exclusions.split(",").map((item) => item.trim().toLocaleLowerCase("es")).filter(Boolean);
    const recipes = data.recipes.filter((recipe) => chosenMeals.includes(recipe.meal) && !recipe.ingredients.some((ingredient) => excluded.some((word) => ingredient.name.toLocaleLowerCase("es").includes(word))));
    if (!recipes.length) { setMessage("Añade al menos una comida en la configuración del hogar."); return; }
    const plan = days.flatMap((date, dayIndex) => chosenMeals.map((meal, mealIndex) => {
      const options = recipes.filter((recipe) => recipe.meal === meal);
      if (!options.length) return null;
      const recipe = options[(dayIndex * 3 + mealIndex) % options.length];
      return { id: uuid(), date, meal, recipeId: recipe.id, servings: data.household.adults + data.household.children.small + data.household.children.primary + data.household.children.teen, approved: false };
    }).filter((item): item is PlannedMeal => item !== null));
    setData((current) => ({ ...current, menu: plan, shopping: [] }));
    setPage("menu");
    setMessage("Menú creado con las recetas disponibles. Revísalo antes de generar la compra.");
  }

  function approveAndBuildShopping() {
    const needed = new Map<string, { name: string; amount: number; unit: string; category: string; fallback: string }>();
    for (const meal of data.menu) {
      const recipe = recipeById.get(meal.recipeId);
      if (!recipe) continue;
      for (const ingredient of recipe.ingredients) {
        const key = ingredient.name.toLocaleLowerCase("es");
        const parsed = parseAmount(ingredient.quantity);
        const normalized = parsed ? baseAmount(parsed.amount * meal.servings, parsed.unit) : null;
        const entry = needed.get(key) ?? { name: ingredient.name, amount: 0, unit: normalized?.unit ?? "", category: ingredient.category, fallback: ingredient.quantity };
        if (normalized && normalized.unit === entry.unit) entry.amount += normalized.amount;
        else if (!normalized) entry.fallback = `${entry.fallback} × ${meal.servings} raciones`;
        needed.set(key, entry);
      }
    }
    for (const name of data.household.essentials.split(",").map((item) => item.trim()).filter(Boolean)) {
      const key = name.toLocaleLowerCase("es");
      if (!needed.has(key)) needed.set(key, { name, amount: 0, unit: "", category: "Imprescindibles", fallback: "Cantidad pendiente" });
    }
    const pantryNames = new Set(data.pantry.filter((item) => item.enough).map((item) => data.products.find((product) => product.id === item.productId)?.name.toLocaleLowerCase("es")));
    const list: ShoppingItem[] = Array.from(needed.values()).filter((item) => !pantryNames.has(item.name.toLocaleLowerCase("es"))).map((item) => {
      const product = data.products.find((candidate) => candidate.name.toLocaleLowerCase("es") === item.name.toLocaleLowerCase("es"));
      let quantity = item.amount ? printAmount(item.amount, item.unit) : item.fallback;
      let linePrice: number | null = null;
      if (item.amount && product?.verified && product.price !== null) {
        const pack = parseAmount(product.pack);
        const packAmount = pack ? baseAmount(pack.amount, pack.unit) : null;
        if (packAmount && packAmount.unit === item.unit && packAmount.amount > 0) {
          const packages = Math.ceil(item.amount / packAmount.amount);
          linePrice = product.price * packages;
          quantity = `${packages} envase${packages === 1 ? "" : "s"} · ${printAmount(item.amount, item.unit)}`;
        }
      }
      return { id: uuid(), name: item.name, category: item.category, quantity, productId: product?.id ?? null, price: linePrice, bought: false, paidPrice: null };
    });
    setData((current) => ({ ...current, menu: current.menu.map((item) => ({ ...item, approved: true })), shopping: list }));
    setPage("compra");
    setMessage("Lista creada. Los productos sin coincidencia verificada aparecen sin precio.");
  }

  function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawPrice = String(form.get("price") ?? "").trim().replace(",", ".");
    const product: Product = { id: uuid(), name: String(form.get("name") ?? "").trim(), brand: String(form.get("brand") ?? "").trim(), category: String(form.get("category") ?? "Otros"), pack: String(form.get("pack") ?? "").trim(), price: rawPrice ? Number(rawPrice) : null, postalCode: data.household.postalCode, updatedAt: new Date().toISOString(), verified: false };
    if (!product.name || (rawPrice && !Number.isFinite(product.price))) { setMessage("Revisa el nombre y el precio."); return; }
    setData((current) => ({ ...current, products: [...current.products, product] }));
    event.currentTarget.reset();
    setMessage("Producto añadido como dato manual; su precio no se considera verificado.");
  }

  async function importWorkbook(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!window.confirm("¿Confirmas que este Excel procede de una fuente autorizada y contiene precios verificados para la tienda o zona indicada?")) { event.target.value = ""; return; }
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("No se encontró una hoja de productos.");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const normalized = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase(), value]));
      const parsed: Product[] = [];
      for (const original of rows) {
        const row = normalized(original);
        const name = String(row.nombre ?? row.name ?? "").trim();
        if (!name) continue;
        const priceText = String(row.precio ?? row.price ?? "").trim().replace(",", ".");
        const price = priceText ? Number(priceText) : null;
        parsed.push({ id: uuid(), name, brand: String(row.marca ?? row.brand ?? ""), category: String(row.categoria ?? row.category ?? "Otros"), pack: String(row.formato ?? row.pack ?? ""), price: price !== null && Number.isFinite(price) ? price : null, postalCode: String(row.codigo_postal ?? row.postalcode ?? data.household.postalCode), updatedAt: new Date().toISOString(), verified: price !== null && Number.isFinite(price) });
      }
      setData((current) => ({ ...current, products: [...current.products, ...parsed] }));
      setMessage(`Importación terminada: ${parsed.length} productos válidos. Verifica que el archivo sea una fuente autorizada y reciente.`);
    } catch (error) {
      console.error(error);
      setMessage("No se pudo leer el Excel. Comprueba que incluya columnas Nombre, Precio, Categoría y Formato.");
    } finally { event.target.value = ""; }
  }

  function toggleBought(itemId: string) {
    setData((current) => ({ ...current, shopping: current.shopping.map((item) => item.id === itemId ? { ...item, bought: !item.bought } : item) }));
  }

  function updatePaidPrice(itemId: string, value: string) {
    const price = value.trim() ? Number(value.replace(",", ".")) : null;
    setData((current) => ({ ...current, shopping: current.shopping.map((item) => item.id === itemId ? { ...item, paidPrice: Number.isFinite(price) ? price : null } : item) }));
  }

  function addShoppingDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = String(form.get("date") ?? "");
    if (!date) return;
    setData((current) => ({ ...current, shoppingDates: [...current.shoppingDates, { id: uuid(), date }] }));
    event.currentTarget.reset();
    setMessage("Fecha de compra guardada en este navegador.");
  }

  const shownProducts = data.products.filter((product) => product.name.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));

  if (!ready) return <main className="loading">Cargando Mercaplanner…</main>;

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); setPage("inicio"); }}><span className="brand-mark">M</span><span>merca<span className="brand-accent">planner</span></span></a>
        <div className="house-selector"><span className="house-avatar">{data.household.name.slice(0, 1).toUpperCase()}</span><span><strong>{data.household.name}</strong><small>Espacio local</small></span><span className="chevron">⌄</span></div>
        <p className="nav-label">PLANIFICACIÓN</p>
        <nav className="nav-list" aria-label="Navegación principal">
          {nav.map(([id, label, icon]) => <button key={id} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => setPage(id)}><span className="nav-icon">{icon}</span>{label}{id === "compra" && data.shopping.filter((item) => !item.bought).length > 0 && <span className="nav-count">{data.shopping.filter((item) => !item.bought).length}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="local-badge"><span className="status-dot" />Tus datos se guardan en este navegador</div><button className="nav-item" onClick={() => setPage("hogar")}><span className="nav-icon">⚙</span>Configuración</button></div>
      </aside>

      <main className="main">
        <header className="topbar"><div><span className="eyebrow">PLANIFICACIÓN DEL HOGAR</span><h1>{pageTitle(page)}</h1></div><div className="top-actions"><span className="local-chip"><span className="status-dot" />Modo local</span><button className="avatar-button" title="Configuración" onClick={() => setPage("hogar")}>H</button></div></header>
        {!data.onboarded && <div className="setup-banner"><span className="banner-icon">✦</span><span><strong>Completa tu hogar para empezar</strong><small>Ajusta el presupuesto y las personas que comen en casa.</small></span><button className="button button-dark" onClick={() => setPage("hogar")}>Configurar hogar <span>→</span></button></div>}

        {page === "inicio" && <section className="page-content">
          <div className="welcome-row"><div><p className="date-line">{new Intl.DateTimeFormat("es-ES", { dateStyle: "full" }).format(new Date())}</p><h2>Hola, vamos a organizar el mes.</h2><p className="muted">Planifica tus comidas y prepara las compras de tu hogar.</p></div><button className="button button-green" onClick={generateMenu}>✦ <span>Generar menú mensual</span></button></div>
          <div className="stats-grid">
            <article className="stat-card"><div className="stat-top"><span>Presupuesto del mes</span><span className="stat-icon green-icon">€</span></div><strong>{money(data.household.budget)}</strong><div className="progress-track"><span style={{ width: `${Math.min(100, data.household.budget ? spentTotal / data.household.budget * 100 : 0)}%` }} /></div><small>{money(spentTotal)} gastados · {money(Math.max(0, data.household.budget - spentTotal))} restantes</small></article>
            <article className="stat-card"><div className="stat-top"><span>Compra estimada</span><span className="stat-icon peach-icon">▤</span></div><strong>{money(data.shopping.some((item) => item.price === null) ? null : estimatedTotal)}</strong><small>{data.shopping.filter((item) => item.price === null).length ? `${data.shopping.filter((item) => item.price === null).length} productos sin precio verificado` : `${data.shopping.length} productos en la lista`}</small></article>
            <article className="stat-card"><div className="stat-top"><span>Próxima compra</span><span className="stat-icon blue-icon">◷</span></div><strong className="stat-date">{nextDate ? friendlyDate(nextDate) : "Sin fecha"}</strong><small>{data.shoppingDates.length ? `${data.shoppingDates.length} compras planificadas` : "Añade una fecha para organizarte"}</small></article>
          </div>
          <div className="dashboard-grid">
            <article className="panel menu-preview"><div className="panel-heading"><div><span className="eyebrow">ESTE MES</span><h3>Tu menú mensual</h3></div><button className="text-button" onClick={() => setPage("menu")}>Ver calendario →</button></div>
              {data.menu.length ? <div className="preview-list">{data.menu.filter((meal) => meal.date >= new Date().toISOString().slice(0, 10)).slice(0, 5).map((meal) => { const recipe = recipeById.get(meal.recipeId); return <div className="preview-row" key={meal.id}><span className="date-pill">{new Date(`${meal.date}T12:00:00`).getDate()}<small>{new Intl.DateTimeFormat("es-ES", { month: "short" }).format(new Date(`${meal.date}T12:00:00`))}</small></span><div className="preview-copy"><small>{meal.meal}</small><strong>{recipe?.name ?? "Receta"}</strong></div><span className="meal-dot" /></div>; })}</div> : <EmptyState icon="▦" title="Tu calendario está vacío" text="Genera un menú para ver aquí las próximas comidas." action="Generar menú" onAction={generateMenu} />}
            </article>
            <article className="panel purchase-preview"><div className="panel-heading"><div><span className="eyebrow">PRÓXIMO PASO</span><h3>Lista de compra</h3></div><button className="text-button" onClick={() => setPage("compra")}>Abrir lista →</button></div>
              {data.shopping.length ? <div className="purchase-lines">{data.shopping.slice(0, 5).map((item) => <div className="purchase-line" key={item.id}><span className={`fake-check ${item.bought ? "checked" : ""}`} /> <span>{item.name}</span><span className="line-price">{money(item.price)}</span></div>)}<div className="purchase-footer">{data.shopping.length} artículos <strong>{data.shopping.some((item) => item.price === null) ? "Total incompleto" : money(estimatedTotal)}</strong></div></div> : <EmptyState icon="☷" title="La lista aparecerá aquí" text="Aprueba el menú cuando estés listo y generaremos los ingredientes." action="Ver menú" onAction={() => setPage("menu")} />}
            </article>
          </div>
          <div className="bottom-grid"><article className="panel quick-panel"><div className="panel-heading"><div><span className="eyebrow">ORGANIZA</span><h3>Accesos rápidos</h3></div></div><div className="quick-links"><button onClick={() => setPage("hogar")}><span className="quick-icon q-green">⌂</span><span><strong>Mi hogar</strong><small>Personas y preferencias</small></span><b>→</b></button><button onClick={() => setPage("despensa")}><span className="quick-icon q-yellow">▤</span><span><strong>Mi despensa</strong><small>Lo que ya tienes en casa</small></span><b>→</b></button><button onClick={() => setPage("catalogo")}><span className="quick-icon q-lilac">⌕</span><span><strong>Catálogo</strong><small>{data.products.length} productos locales</small></span><b>→</b></button></div></article><article className="tip-card"><span className="tip-spark">✳</span><div><span className="eyebrow">CONSEJO DE AHORRO</span><h3>Planifica con lo que ya tienes</h3><p>Marca los productos suficientes en la despensa antes de generar la lista y evita compras duplicadas.</p><button className="text-button" onClick={() => setPage("despensa")}>Revisar despensa →</button></div><div className="tip-decoration">✿</div></article></div>
        </section>}

        {page === "hogar" && <section className="page-content narrow-content"><div className="section-intro"><span className="eyebrow">CONFIGURACIÓN DEL HOGAR</span><h2>Un plan que encaja con vuestra rutina.</h2><p className="muted">Estos datos se guardan solo en este navegador.</p></div><HouseholdForm household={data.household} onSave={(household) => { setData((current) => ({ ...current, household, onboarded: true })); setMessage("Configuración guardada."); }} /></section>}

        {page === "menu" && <section className="page-content"><div className="section-intro split-intro"><div><span className="eyebrow">CALENDARIO DE COMIDAS</span><h2>Plan mensual</h2><p className="muted">Revisa los platos. La compra se prepara cuando apruebas el menú.</p></div><div className="menu-actions"><input className="month-input" type="month" value={data.month} onChange={(event) => setData((current) => ({ ...current, month: event.target.value }))} /><button className="button button-green" onClick={generateMenu}>↻ Generar menú</button></div></div>
          <div className="notice notice-soft"><span>i</span><p>El plan usa recetas de ejemplo en esta primera versión local. Los precios solo aparecerán cuando se correspondan con productos importados como verificados.</p></div>
          {data.menu.length ? <div className="calendar-grid">{data.menu.slice(0, 90).map((meal) => { const recipe = recipeById.get(meal.recipeId); return <article className="calendar-card" key={meal.id}><div className="calendar-date"><strong>{new Date(`${meal.date}T12:00:00`).getDate()}</strong><span>{meal.meal}</span></div><button className="meal-card-body" onClick={() => { const replacement = data.recipes.filter((candidate) => candidate.meal === meal.meal); const current = replacement.findIndex((candidate) => candidate.id === meal.recipeId); const next = replacement[(current + 1) % replacement.length]; if (next) addMeal(meal.date, meal.meal, next.id); }} title="Cambiar al siguiente plato de este tipo"><span className="recipe-name">{recipe?.name}</span><span className="recipe-meta">{recipe?.time} min · {meal.servings} raciones</span><span className="swap-hint">↻ Cambiar plato</span></button><span className={`approval-tag ${meal.approved ? "approved" : "draft"}`}>{meal.approved ? "Aprobado" : "Por revisar"}</span></article>; })}</div> : <div className="panel empty-panel"><EmptyState icon="▦" title="Aún no hay un menú" text="Genera un borrador según las comidas y comensales configurados." action="Generar menú" onAction={generateMenu} /></div>}
          {data.menu.length > 0 && <div className="sticky-approve"><div><strong>{data.menu.length} comidas planificadas</strong><span>Podrás cambiar los platos antes de crear la lista.</span></div><button className="button button-green" onClick={approveAndBuildShopping}>Aprobar y generar compra →</button></div>}
        </section>}

        {page === "compra" && <section className="page-content"><div className="section-intro split-intro"><div><span className="eyebrow">COMPRA DEL HOGAR</span><h2>Tu lista de compra</h2><p className="muted">Productos por categorías. Los precios pendientes no se estiman.</p></div><form className="date-form" onSubmit={addShoppingDate}><input name="date" type="date" required /><button className="button button-outline">＋ Fecha</button></form></div>
          <div className="shopping-overview"><div><span>Artículos</span><strong>{data.shopping.length}</strong></div><div><span>Comprados</span><strong>{data.shopping.filter((item) => item.bought).length}</strong></div><div><span>Importe conocido</span><strong>{money(estimatedTotal)}</strong></div><div><span>Gasto registrado</span><strong>{money(spentTotal)}</strong></div></div>
          {data.shopping.length ? <div className="shopping-layout"><div className="panel shopping-panel">{Array.from(new Set(data.shopping.map((item) => item.category))).map((category) => <div className="shopping-category" key={category}><h3>{category}<span>{data.shopping.filter((item) => item.category === category).length}</span></h3>{data.shopping.filter((item) => item.category === category).map((item) => <div className={`shopping-row ${item.bought ? "is-bought" : ""}`} key={item.id}><button className={`check-button ${item.bought ? "on" : ""}`} aria-label={item.bought ? "Marcar pendiente" : "Marcar comprado"} onClick={() => toggleBought(item.id)}>{item.bought ? "✓" : ""}</button><div className="shopping-name"><strong>{item.name}</strong><small>{item.quantity} · {item.price === null ? "Sin precio verificado" : money(item.price)}</small></div><label className="paid-price"><span>Pagado €</span><input type="number" min="0" step="0.01" value={item.paidPrice ?? ""} onChange={(event) => updatePaidPrice(item.id, event.target.value)} placeholder="—" /></label></div>)}</div>)}</div><aside className="panel shopping-side"><span className="eyebrow">COMPRAS DEL MES</span><h3>Fechas elegidas</h3>{data.shoppingDates.length ? data.shoppingDates.slice().sort((a, b) => a.date.localeCompare(b.date)).map((date) => <div className="date-row" key={date.id}><span className="date-icon">◷</span><strong>{friendlyDate(date.date)}</strong><button aria-label="Eliminar fecha" onClick={() => setData((current) => ({ ...current, shoppingDates: current.shoppingDates.filter((item) => item.id !== date.id) }))}>×</button></div>) : <p className="muted small-copy">Aún no has programado compras.</p>}<div className="side-divider"/><div className="total-row"><span>Total con precio conocido</span><strong>{money(estimatedTotal)}</strong></div>{data.shopping.some((item) => item.price === null) && <p className="warning-copy">El total está incompleto porque hay productos sin precio verificado.</p>}</aside></div> : <div className="panel empty-panel"><EmptyState icon="☷" title="Todavía no hay artículos" text="Aprueba un menú para preparar la lista. También puedes importar el catálogo antes." action="Ir al menú" onAction={() => setPage("menu")} /></div>}
        </section>}

        {page === "despensa" && <section className="page-content"><div className="section-intro"><span className="eyebrow">INVENTARIO DE CASA</span><h2>Mi despensa</h2><p className="muted">Marca qué productos tienes. Antes de cada compra confirmarás si hay suficiente.</p></div>{data.products.length ? <div className="pantry-grid">{data.products.map((product) => { const item = data.pantry.find((entry) => entry.productId === product.id); return <button className={`pantry-card ${item?.enough ? "pantry-active" : ""}`} key={product.id} onClick={() => setData((current) => ({ ...current, pantry: current.pantry.some((entry) => entry.productId === product.id) ? current.pantry.map((entry) => entry.productId === product.id ? { ...entry, enough: !entry.enough } : entry) : [...current.pantry, { productId: product.id, enough: true }] }))}><span className="check-button">{item?.enough ? "✓" : ""}</span><strong>{product.name}</strong><small>{item?.enough ? "Hay suficiente" : "Marcar como disponible"}</small></button>; })}</div> : <div className="panel empty-panel"><EmptyState icon="▤" title="Empieza con el catálogo" text="Importa productos y luego marca los que ya tienes en casa." action="Abrir catálogo" onAction={() => setPage("catalogo")} /></div>}</section>}

        {page === "catalogo" && <section className="page-content"><div className="section-intro split-intro"><div><span className="eyebrow">DATOS DE PRODUCTO</span><h2>Catálogo</h2><p className="muted">No hay precios precargados. Importa tu Excel verificado o añade referencias manuales.</p></div><label className="button button-outline upload-button">↑ Importar Excel<input type="file" accept=".xlsx,.xls" onChange={importWorkbook} /></label></div>
          <div className="notice notice-warning"><span>!</span><p>Solo marca como verificados los datos procedentes de una fuente autorizada y actualizada. Los productos añadidos manualmente nunca se consideran verificados automáticamente.</p></div>
          <form className="product-form panel" onSubmit={addProduct}><div className="form-heading"><div><span className="eyebrow">AÑADIR REFERENCIA</span><h3>Producto manual</h3></div><span className="manual-chip">Pendiente de verificar</span></div><div className="product-fields"><label>Nombre<input name="name" required placeholder="Ej. Arroz redondo" /></label><label>Marca<input name="brand" placeholder="Opcional" /></label><label>Categoría<select name="category"><option>Frutas y verduras</option><option>Carnicería</option><option>Pescadería</option><option>Huevos y lácteos</option><option>Despensa</option><option>Conservas</option><option>Congelados</option><option>Panadería</option><option>Desayunos</option><option>Otros</option></select></label><label>Formato<input name="pack" placeholder="Ej. 1 kg" /></label><label>Precio €<input name="price" type="number" min="0" step="0.01" placeholder="Opcional" /></label><button className="button button-dark">Añadir producto</button></div></form>
          <div className="catalog-tools"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar productos..." /></label><span className="muted">{shownProducts.length} referencias</span></div>
          {shownProducts.length ? <div className="panel table-wrap"><table className="catalog-table"><thead><tr><th>Producto</th><th>Categoría</th><th>Formato</th><th>Precio</th><th>Estado</th></tr></thead><tbody>{shownProducts.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>{product.brand || "Sin marca"}</small></td><td>{product.category}</td><td>{product.pack || "—"}</td><td>{money(product.verified ? product.price : null)}</td><td><span className={`status-tag ${product.verified ? "verified" : "pending"}`}>{product.verified ? "Verificado" : "Manual / pendiente"}</span></td></tr>)}</tbody></table></div> : <div className="panel empty-panel"><EmptyState icon="⌕" title="Catálogo vacío" text="La aplicación no inventará precios. Añade productos manuales o importa un Excel del catálogo." /></div>}
        </section>}
        <footer className="page-footer">Mercaplanner · Versión local de desarrollo <span>Los datos se guardan en este navegador.</span></footer>
      </main>
      {message && <div className="toast" role="status">{message}</div>}
    </div>
  );
}

function pageTitle(page: Page) { return nav.find(([id]) => id === page)?.[1] ?? "Inicio"; }

function EmptyState({ icon, title, text, action, onAction }: { icon: string; title: string; text: string; action?: string; onAction?: () => void }) {
  return <div className="empty-state"><span className="empty-icon">{icon}</span><strong>{title}</strong><p>{text}</p>{action && onAction && <button className="button button-outline" onClick={onAction}>{action} →</button>}</div>;
}

function HouseholdForm({ household, onSave }: { household: Household; onSave: (household: Household) => void }) {
  const [form, setForm] = useState(household);
  const toggleMeal = (meal: string) => setForm((current) => ({ ...current, meals: current.meals.includes(meal) ? current.meals.filter((item) => item !== meal) : [...current.meals, meal] }));
  return <form className="panel household-form" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
    <div className="form-heading"><div><span className="eyebrow">DATOS BÁSICOS</span><h3>Vuestro hogar</h3></div><span className="required-note">Los cambios se guardan al pulsar Guardar</span></div>
    <div className="form-grid"><label>Nombre del hogar<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Presupuesto mensual (€)<input type="number" min="0" step="1" value={form.budget} onChange={(event) => setForm({ ...form, budget: Number(event.target.value) })} required /></label><label>Código postal<input value={form.postalCode} maxLength={5} onChange={(event) => setForm({ ...form, postalCode: event.target.value })} placeholder="Ej. 28001" /></label><label>Adultos<input type="number" min="0" max="20" value={form.adults} onChange={(event) => setForm({ ...form, adults: Number(event.target.value) })} /></label></div>
    <div className="form-subsection"><div><h4>Niños por grupo de edad</h4><p>Se usarán para calcular raciones en la planificación.</p></div><div className="age-grid">{([["small", "0–5 años"], ["primary", "6–11 años"], ["teen", "12–17 años"]] as const).map(([key, label]) => <label key={key}>{label}<input type="number" min="0" max="20" value={form.children[key]} onChange={(event) => setForm({ ...form, children: { ...form.children, [key]: Number(event.target.value) } })} /></label>)}</div></div>
    <div className="form-subsection"><div><h4>Comidas a planificar</h4><p>Puedes elegir varias; se planificarán para los asistentes configurados.</p></div><div className="choice-grid">{["Desayuno", "Comida", "Merienda", "Cena"].map((meal) => <label className={`choice-chip ${form.meals.includes(meal) ? "selected" : ""}`} key={meal}><input type="checkbox" checked={form.meals.includes(meal)} onChange={() => toggleMeal(meal)} />{meal}</label>)}</div></div>
    <div className="form-grid"><label>Estilo de cocina<select value={form.cooking} onChange={(event) => setForm({ ...form, cooking: event.target.value as Household["cooking"] })}><option value="diario">Cocinar cada día</option><option value="batch">Cocinar varias raciones</option><option value="mixto">Combinar ambas</option></select></label><label>Alimentos que no gustan<input value={form.exclusions} onChange={(event) => setForm({ ...form, exclusions: event.target.value })} placeholder="Separados por comas" /></label><label className="wide-field">Alergias e intolerancias<textarea value={form.allergies} onChange={(event) => setForm({ ...form, allergies: event.target.value })} placeholder="En esta versión local, declarar una alergia bloqueará la generación de menús" rows={2} /></label><label className="wide-field">Productos imprescindibles<textarea value={form.essentials} onChange={(event) => setForm({ ...form, essentials: event.target.value })} placeholder="Anota los productos que no pueden faltar, separados por comas" rows={2} /></label></div>
    <div className="form-actions"><span className="muted small-copy">Prioridad del plan: ahorro</span><button className="button button-green" type="submit">Guardar configuración</button></div>
  </form>;
}

