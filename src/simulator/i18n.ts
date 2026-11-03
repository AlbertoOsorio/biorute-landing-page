import type { LossCauseKey } from "./config";

type CauseText = { title: string; help: string; priceLabel: string };

const es = {
  eyebrow: "Simulador de pérdidas",
  title: "¿Cuánto vale tu fruta que no llega a buen precio?",
  lead:
    "Ingresa los números de tu última temporada. Calculamos al instante cuánto dinero se pierde, por qué, y cuánto de ese ingreso puede recuperar nuestra tecnología de post-cosecha.",
  loadExample: "Cargar ejemplo",
  reset: "Limpiar",
  privacy:
    "Los datos que ingreses se guardan de forma anónima para mejorar nuestras estimaciones. Solo te contactaremos si nos dejas tus datos al final.",

  s1: "Tu operación",
  s1Lead: "Lo básico para dimensionar la temporada.",
  fruit: "Fruta",
  fruits: { avocado: "Palta", cherry: "Cereza", other: "Otra" },
  fruitOther: "¿Cuál?",
  currency: "Moneda",
  volume: "Volumen total de la temporada",
  tons: "toneladas",

  s2: "Tus precios de la temporada",
  s2Lead: "Precio recibido por kilo. Indica la semana del año (1–52) en que ocurrió.",
  best: "Mejor precio",
  worst: "Peor precio",
  avg: "Precio promedio",
  week: "Semana",
  perKg: "/kg",
  addWeek: "Agregar otra semana",
  extraHint: "Opcional: suma más semanas para dibujar mejor la curva.",
  crossesYear: "Mi temporada cruza el año (ej. noviembre a febrero)",
  crossesYearHelp: "Las semanas 1–26 se muestran después de la semana 52.",
  remove: "Quitar",
  chartPriceTitle: "Así evolucionó tu precio",
  chartPriceEmpty: "Completa al menos dos semanas con precio para ver la curva.",
  avgLine: "Promedio",
  spread: "Diferencia entre tu mejor y peor semana",
  weekShort: "Sem.",

  s3: "¿Por qué estás perdiendo dinero?",
  s3Lead:
    "Indica qué porcentaje de tu volumen terminó en cada situación y a qué precio la vendiste. Lo que no asignes se considera vendido al precio promedio.",
  pctVolume: "% del volumen",
  otherLabel: "Describe la causa",
  addOther: "Agregar otra causa (opcional)",
  causes: {
    spoiled: {
      title: "Se echó a perder",
      help: "Pudrición, deshidratación o descarte. Se considera sin ingreso.",
      priceLabel: "",
    },
    discounted: {
      title: "Se vendió más barata",
      help: "Descuentos o rechazos por madurez, calidad o condición en destino.",
      priceLabel: "Precio obtenido",
    },
    diverted: {
      title: "Se fue a otra aplicación",
      help: "Industria, mercado interno, aceite, pulpa u otro uso de menor valor.",
      priceLabel: "Precio obtenido",
    },
    oversupply: {
      title: "Sobreoferta",
      help: "Tuviste que vender en semanas saturadas porque la fruta no aguantaba esperar o viajar más lejos.",
      priceLabel: "Precio obtenido",
    },
    other: {
      title: "Otra causa",
      help: "Cualquier otra razón por la que la fruta no llegó al precio promedio.",
      priceLabel: "Precio obtenido",
    },
  } as Record<LossCauseKey, CauseText>,
  normalSale: "Venta normal (precio promedio)",
  overflow: "Los porcentajes suman más de 100%. Revisa los valores.",
  assigned: "Volumen asignado a pérdidas",
  chartVolumeTitle: "¿Dónde terminó tu fruta?",
  chartLossTitle: "Dinero perdido por causa",
  chartLossEmpty: "Ingresa volumen, precio promedio y al menos una causa para ver tus pérdidas.",
  lossLegend: "Pérdida actual",
  recoverLegend: "Recuperable con nuestra tecnología (rango)",

  s4: "Tu resultado",
  s4Lead: "Calculado con tus datos y el efecto estimado de nuestra formulación en cada causa de pérdida.",
  needData: "Completa volumen y precio promedio para ver tu resultado.",
  potential: "Ingreso potencial",
  potentialHelp: "Todo tu volumen al precio promedio",
  actual: "Ingreso real estimado",
  totalLoss: "Ingreso perdido en la temporada",
  ofPotential: "del ingreso potencial",
  recovered: "Ingreso adicional que puedes recuperar con nuestra tecnología",
  perSeason: "por temporada",
  grossNote:
    "Es ingreso bruto adicional: lo que hoy dejas de recibir por fruta que se pierde o se vende más barata. Aún no descuenta el costo del tratamiento, que definimos contigo en una propuesta para tu operación.",
  upliftLabel: "Es como si tu precio promedio subiera a",
  today: "Hoy",
  tonsLabel: "Equivale a vender más fruta al precio promedio",
  shareLabel: "De lo que hoy pierdes, recuperas",
  lossBarCaption: "Ingreso que hoy pierdes por temporada",
  cta: "Quiero una propuesta para mi operación",
  whyLink: "¿De dónde sale este valor?",
  whyTitle: "¿De dónde sale este valor?",
  whyIntro:
    "Nuestra formulación se aplica en el agua de lavado de la planta de proceso y deja una capa protectora con péptidos que frenan el etileno (la hormona que acelera la maduración), el desarrollo de hongos y la deshidratación. El resultado es más vida útil: la fruta llega a destino en mejor condición y tú ganas tiempo para decidir cuándo y dónde vender.",
  whyDays: (a: number, b: number) =>
    `Supuesto base: la fruta tratada conserva su calidad comercial entre ${a} y ${b} días más que la fruta sin tratar.`,
  whyFormula:
    "Esos días adicionales evitan una parte de cada pérdida que ingresaste. Para cada causa calculamos: ingreso que hoy pierdes × porcentaje de esa pérdida que se evita. Usamos un rango entre un escenario conservador y uno optimista.",
  whyRate: "de esta pérdida se evita",
  whyYouLose: "Hoy pierdes",
  whyYouRecover: "recuperas",
  whyNoLoss: "No ingresaste pérdida por esta causa.",
  causeWhy: {
    spoiled:
      "Menos pudrición y deshidratación. La acción antimicrobiana y anti-etileno retrasa la descomposición, así parte de la fruta que hoy se descarta llega en condición de venta.",
    discounted:
      "Llega más firme, con mejor color y pedúnculo más verde. Con unos días más de calidad, menos cajas reciben descuentos o rechazos en destino.",
    diverted:
      "Algo más de fruta cumple el estándar de exportación. Una parte de lo que hoy se va a industria o mercado interno porque llegaría justa al destino puede exportarse.",
    oversupply:
      "Un margen de tiempo para elegir cuándo vender. Algunos días extra pueden permitirte esperar a que pase el peak de oferta en vez de vender en la peor semana.",
    other: "Efecto indirecto de la mayor vida útil; por eso usamos el supuesto más conservador.",
  } as Record<LossCauseKey, string>,
  chartCompareTitle: "Ingreso que pierdes en la temporada: hoy vs. con nuestra tecnología",
  lossToday: "Pérdida hoy",
  lossWithTech: "Con nuestra tecnología",
  legendKept: "Pérdida que se mantiene",
  legendRecLow: "Recuperado (escenario conservador)",
  legendRecHigh: "Recuperado adicional (escenario optimista)",
  pill: "Ingreso recuperable",
  pillShort: "Recuperable",

  s5: "Conversemos tu caso",
  s5Lead:
    "Déjanos tus datos y te enviamos una evaluación personalizada con estos números. Tu simulación se adjunta automáticamente.",
  name: "Nombre",
  company: "Empresa / predio",
  email: "Correo",
  phone: "Teléfono (opcional)",
  message: "Comentarios (opcional)",
  send: "Enviar mi simulación",
  sending: "Enviando…",
  sent: "¡Listo! Recibimos tu simulación y te contactaremos pronto.",
  error: "No pudimos enviar. Intenta nuevamente o escríbenos a contacto@bioroutebt.com.",
  nav: "Simulador",
};

const en: typeof es = {
  eyebrow: "Loss simulator",
  title: "How much is the fruit that misses a good price worth?",
  lead:
    "Enter the numbers from your last season. We instantly calculate how much money is lost, why, and how much of that revenue our post-harvest technology can recover.",
  loadExample: "Load example",
  reset: "Clear",
  privacy:
    "The data you enter is stored anonymously to improve our estimates. We'll only contact you if you leave your details at the end.",

  s1: "Your operation",
  s1Lead: "The basics to size your season.",
  fruit: "Fruit",
  fruits: { avocado: "Avocado", cherry: "Cherry", other: "Other" },
  fruitOther: "Which one?",
  currency: "Currency",
  volume: "Total season volume",
  tons: "tonnes",

  s2: "Your season prices",
  s2Lead: "Price received per kilo. Enter the week of the year (1–52) when it happened.",
  best: "Best price",
  worst: "Worst price",
  avg: "Average price",
  week: "Week",
  perKg: "/kg",
  addWeek: "Add another week",
  extraHint: "Optional: add more weeks to draw a better curve.",
  crossesYear: "My season crosses the new year (e.g. November to February)",
  crossesYearHelp: "Weeks 1–26 are shown after week 52.",
  remove: "Remove",
  chartPriceTitle: "How your price evolved",
  chartPriceEmpty: "Fill in at least two weeks with a price to see the curve.",
  avgLine: "Average",
  spread: "Gap between your best and worst week",
  weekShort: "Wk",

  s3: "Why are you losing money?",
  s3Lead:
    "Enter what share of your volume ended up in each situation and the price you got. Anything not assigned is considered sold at the average price.",
  pctVolume: "% of volume",
  otherLabel: "Describe the cause",
  addOther: "Add another cause (optional)",
  causes: {
    spoiled: {
      title: "It spoiled",
      help: "Decay, dehydration or culls. Counted as zero revenue.",
      priceLabel: "",
    },
    discounted: {
      title: "Sold at a discount",
      help: "Discounts or rejections due to ripeness, quality or arrival condition.",
      priceLabel: "Price obtained",
    },
    diverted: {
      title: "Diverted to another use",
      help: "Processing, domestic market, oil, pulp or other lower-value use.",
      priceLabel: "Price obtained",
    },
    oversupply: {
      title: "Oversupply",
      help: "You had to sell in saturated weeks because the fruit couldn't wait or travel further.",
      priceLabel: "Price obtained",
    },
    other: {
      title: "Other cause",
      help: "Any other reason the fruit didn't reach the average price.",
      priceLabel: "Price obtained",
    },
  },
  normalSale: "Normal sale (average price)",
  overflow: "Percentages add up to more than 100%. Please check the values.",
  assigned: "Volume assigned to losses",
  chartVolumeTitle: "Where did your fruit end up?",
  chartLossTitle: "Money lost by cause",
  chartLossEmpty: "Enter volume, average price and at least one cause to see your losses.",
  lossLegend: "Current loss",
  recoverLegend: "Recoverable with our technology (range)",

  s4: "Your result",
  s4Lead: "Calculated with your data and the estimated effect of our formulation on each loss cause.",
  needData: "Fill in volume and average price to see your result.",
  potential: "Potential revenue",
  potentialHelp: "All your volume at the average price",
  actual: "Estimated actual revenue",
  totalLoss: "Revenue lost in the season",
  ofPotential: "of potential revenue",
  recovered: "Additional revenue you can recover with our technology",
  perSeason: "per season",
  grossNote:
    "This is additional gross revenue: what you currently miss out on from fruit that is lost or sold cheaper. It does not yet deduct the cost of the treatment, which we define with you in a proposal for your operation.",
  upliftLabel: "As if your average price rose to",
  today: "Today",
  tonsLabel: "Equivalent to selling more fruit at the average price",
  shareLabel: "Of what you lose today, you recover",
  lossBarCaption: "Revenue you lose today per season",
  cta: "I want a proposal for my operation",
  whyLink: "Where does this value come from?",
  whyTitle: "Where does this value come from?",
  whyIntro:
    "Our formulation is applied in the wash water at the packing plant and leaves a protective layer with peptides that slow down ethylene (the hormone that speeds up ripening), fungal growth and dehydration. The result is longer shelf life: fruit arrives in better condition and you gain time to decide when and where to sell.",
  whyDays: (a: number, b: number) =>
    `Base assumption: treated fruit keeps its commercial quality ${a} to ${b} days longer than untreated fruit.`,
  whyFormula:
    "Those extra days prevent part of each loss you entered. For each cause we calculate: revenue you lose today × share of that loss that is avoided. We use a range between a conservative and an optimistic scenario.",
  whyRate: "of this loss is avoided",
  whyYouLose: "You lose",
  whyYouRecover: "you recover",
  whyNoLoss: "You didn't enter a loss for this cause.",
  causeWhy: {
    spoiled:
      "Less decay and dehydration. The antimicrobial and anti-ethylene action delays spoilage, so part of the fruit you discard today arrives in sellable condition.",
    discounted:
      "Arrives firmer, with better colour and greener stems. With a few more days of quality, fewer boxes get discounts or rejections at destination.",
    diverted:
      "Somewhat more fruit meets export standards. Part of what goes to processing or the domestic market today because it would arrive borderline can be exported.",
    oversupply:
      "Some leeway to choose when to sell. A few extra days can let you wait out the supply peak instead of selling in the worst week.",
    other: "An indirect effect of longer shelf life, so we use the most conservative assumption.",
  },
  chartCompareTitle: "Revenue lost in the season: today vs. with our technology",
  lossToday: "Loss today",
  lossWithTech: "With our technology",
  legendKept: "Remaining loss",
  legendRecLow: "Recovered (conservative scenario)",
  legendRecHigh: "Additional recovery (optimistic scenario)",
  pill: "Recoverable revenue",
  pillShort: "Recoverable",

  s5: "Let's talk about your case",
  s5Lead:
    "Leave your details and we'll send you a personalised assessment with these numbers. Your simulation is attached automatically.",
  name: "Name",
  company: "Company / orchard",
  email: "Email",
  phone: "Phone (optional)",
  message: "Comments (optional)",
  send: "Send my simulation",
  sending: "Sending…",
  sent: "Done! We received your simulation and will contact you soon.",
  error: "We couldn't send it. Please try again or email contacto@bioroutebt.com.",
  nav: "Simulator",
};

export const simulatorText = { es, en };
export type SimulatorText = typeof es;
