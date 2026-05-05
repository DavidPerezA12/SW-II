const { getGameInfo } = require('../services/wikidata');

async function test() {
  try {
    const info = await getGameInfo("Portal 2");

    if (!info || info.length === 0) {
      console.log("❌ No se encontraron resultados");
      return;
    }

    console.log("✅ Resultados encontrados:");
    console.log(JSON.stringify(info, null, 2));

  } catch (err) {
    console.error("💥 Error en test:", err.message);
  }
}

test();