const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const ITEMS_PER_PAGE = 20;
const url = "https://minecraft.wiki/w/Blocks"; // URL corregida

// Endpoint para obtener los bloques con paginación y búsqueda
app.get("/api/blocks", async (req, res) => {
  try {
    // Recibir los parámetros de la URL
    const page = parseInt(req.query.page) || 1;
    const searchQuery = req.query.search || "";
    const searchId = req.query.id ? parseInt(req.query.id) : null;

    // Realizar el scraping
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);

    let blocksData = [];

    // Extraer los bloques del HTML
    $(".div-col.columns ul li").each((i, block) => {
      const name = $(block).find("a").text().trim();
      const img = $(block).find("img").attr("src");

      if (name && img) {
        const imageUrl = img.replace(/\/30px-/, "/300px-");

        blocksData.push({
          id: i,
          name: name,
          image: "https://minecraft.wiki" + imageUrl,
        });
      }
    });

    // Filtrar los datos si hay una búsqueda
    if (searchQuery) {
      blocksData = blocksData.filter((block) =>
        block.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Calcular el total de elementos
    const totalItems = blocksData.length;

    // Calcular el total de páginas
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // Validar que la página solicitada esté dentro del rango
    if (page < 1 || page > totalPages) {
      return res.status(400).json({ error: "Página fuera de rango" });
    }

    // Calcular el índice de inicio y fin para la página solicitada
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

    // Crear la respuesta paginada
    const paginatedData = blocksData.slice(startIndex, endIndex);

    const response = {
      pagination: {
        current_page: page,
        next_page: page < totalPages ? page + 1 : null,
        prev_page: page > 1 ? page - 1 : null,
        total_pages: totalPages,
        total_count: totalItems,
      },
      data: paginatedData,
    };

    // Enviar la respuesta
    res.json(response);
  } catch (error) {
    console.error("Error al hacer scraping:", error);
    res.status(500).json({ error: error.message });
  }
});

// Iniciar el servidor en el puerto 3000
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
