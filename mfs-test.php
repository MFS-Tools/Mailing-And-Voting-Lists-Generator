<?php
/*
Plugin Name: Minimal API
Description: Minimal plugin with persistent input via REST API.
Version: 1.0
Author: Kyle Bueche

Shortcode: [mfs_rag_frontend]
*/

if (!defined('ABSPATH')) exit;

function rag_frontend( $atts ) {
    $html = <<<HTML
    <!-- Note: Wordpress will try to wrap blank javascript lines with <p></p>, may cause a parse error. -->
    <style>
    .document-card {
        padding: 15px;
        border-color: black;
        border-width: 3px;
        border-style: solid;
        border-radius: 5px;
        box-shadow: 2px 5px 5px grey;
        padding: 5px;
        width: 300px;
        height: auto;
    }
    .document-cards {
        display: grid;
        grid-template-columns: auto auto auto;
        gap: 10px;
    }
    .document-preview {
        width: 100%;
        overflow: hidden;
    }
    </style>
    <h3>RAG Search for UHMFS Public Documents Archive</h3>
    <hr>
    <h5>Search for documents:</h5>
    <textarea id="rag-input" rows=4 cols=50 placeholder="Search here..."></textarea>
    <button id="myButton">Search</button>
    <p id="rag-output-generative-text">Output will appear here.</p>
    <div id="rag-output-documents"></div>
    <div>
    <script>
    async function queryragapi() {
        let ragOutputText = document.getElementById("rag-output-generative-text");
        ragOutputText.innerHTML = "Finding Documents...";
        const input = document.getElementById("rag-input").value;

        console.log("starting api fetch...");
        const response = await fetch("https://rag-mfs-testing.onrender.com/query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ query: input })
        });
        console.log("getting json...");
        const data = await response.json();
        console.log(data);
        ragOutputText.innerHTML = data.answer;
    }
    ragOutputDocuments = document.getElementById("rag-output-documents");
    documents = [];
    documents.push({ docUrl: "https://drive.google.com/file/d/1outes8jvthnMdauDKI8c7f2zejPqkHwh/preview",
                     docTitle: "Doc 1" });
    documents.push({ docUrl: "https://drive.google.com/file/d/1outes8jvthnMdauDKI8c7f2zejPqkHwh/preview",
                     docTitle: "Doc 2" });
    documents.push({ docUrl: "https://drive.google.com/file/d/1outes8jvthnMdauDKI8c7f2zejPqkHwh/preview",
                     docTitle: "Doc 3" });
    documents.push({ docUrl: "https://drive.google.com/file/d/1outes8jvthnMdauDKI8c7f2zejPqkHwh/preview",
                     docTitle: "Doc 4" });
    documents.push({ docUrl: "https://drive.google.com/file/d/1outes8jvthnMdauDKI8c7f2zejPqkHwh/preview",
                     docTitle: "Doc 5" });
    for (let i = 0; i < documents.length; i++)
    {
        // Create the card:
        // <div class="document-cards">
        //   <p class="document-title">Title of my Doc</p>
        //   <br>
        //   <a class="document-link" href="example.link">Link to my Doc</a>
        // </div>

        // Building document title
        let title = document.createElement("p");
        title.innerHTML = documents[i].docTitle;
        title.classList.add("document-title");

        // Building document clickable link
        let link = document.createElement("a");
        link.innerHTML = "Link to document";
        link.href = documents[i].docUrl;
        link.classList.add("document-link");
        // Open link in new tab when clicked
        link.setAttribute('target', '_blank');

        // Building card containing the above
        let card = document.createElement("div");
        card.classList.add("document-card");

        // Build hierarchy
        card.appendChild(title);
        card.appendChild(document.createElement("br"));
        card.appendChild(link);

        // Add the finished card to the output container
        ragOutputDocuments.classList.add("document-cards");
        ragOutputDocuments.appendChild(card);
    }
    document.getElementById("myButton").onclick = function(){queryragapi();};
    </script>
    </div>
    HTML;
    return $html;
}

add_shortcode( 'mfs_rag_frontend', 'rag_frontend' );