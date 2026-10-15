//Name: Keile Cruz-Maldonado
//Date: Oct. 14th, 2026
//CSC 372-01
// This is the script.js for assignment 4 where it handles searching for TV shows,
// fetching show and cast information, and displaying the results
// in a responsive gallery.

const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const gallery = document.getElementById("gallery");
const statusMesg = document.getElementById("status");


searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    searchShows(searchInput.value);
});

//
function getValue(value) {
    if (value == null || value == undefined || value == "") {
        return "Not Available";
    }

    return value;
}

//this removes the html markup
function cleanSummary(summary) {
    if (!summary) {
        return "Not available";
    }

    const parser = new DOMParser();
    const documentText = parser.parseFromString(summary, "text/html");

    return documentText.body.textContent.trim() || "Not available";
}

//formats the last-update timestamp
function formatUpdated(timestamp) {
    if (timestamp === null || timestamp === undefined) {
        return "Not available";
    }

    const date = new Date(timestamp * 1000);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString();
}

//adds in a paragraph (using textContent)
function addParagraph(card, label, value) {
    const paragraph = document.createElement("p");
    paragraph.textContent = label + ": " + getValue(value);
    card.appendChild(paragraph);
}

//fetch catches all the information for a show
async function getCast(showId) {
    const response = await fetch(
        `https://api.tvmaze.com/shows/${showId}/cast`
    );

    if (!response.ok) {
        throw new Error("Unable to load cast information.");
    }

    return await response.json();
}

//creating a new card for the show 
function createShowCard(show, cast) {
    const card = document.createElement("article");
    card.className = "show-card";

    // Shows poster, if available, if not then it will display "poster no available"
    if (show.image && show.image.medium) {
        const poster = document.createElement("img");
        poster.src = show.image.medium;
        poster.alt = "Poster for " + getValue(show.name);
        poster.loading = "lazy";

        // Display a message if the poster fails to load.
        poster.addEventListener("error", function () {
            const fallback = document.createElement("p");
            fallback.textContent = "Poster not available";
            poster.replaceWith(fallback);
        });

        card.appendChild(poster);
    } else {
        const fallback = document.createElement("p");
        fallback.textContent = "Poster not available";
        card.appendChild(fallback);
    }

    //Shows all the information for the show
    
    //showcases title
    const title = document.createElement("h2");
    title.textContent = getValue(show.name);
    card.appendChild(title);

    //showcases the summary
    const summary = document.createElement("p");
    summary.className = "summary";
    summary.textContent = cleanSummary(show.summary);
    card.appendChild(summary);

    // showcases the premiere
    addParagraph(card, "Premiered", show.premiered);

    // showcases the last updated.
    addParagraph(card, "Last updated", formatUpdated(show.updated));

    // showcases the genre.
    const genres = show.genres && show.genres.length > 0
        ? show.genres.join(", ")
        : "Not available";

    addParagraph(card, "Genres", genres);

    // showcases the average rating.
    const rating = show.rating && show.rating.average !== null
        && show.rating.average !== undefined
        ? show.rating.average + "/10"
        : "Not available";

    addParagraph(card, "Average rating", rating);

    // showcases the main cast
    const castHeading = document.createElement("h3");
    castHeading.textContent = "Main Cast";
    card.appendChild(castHeading);

    const castParagraph = document.createElement("p");
    castParagraph.className = "cast";

    if (cast.length > 0) {
        const castNames = cast
            .slice(0, 5)
            .map(function (member) {
                const personName = member.person
                    ? member.person.name
                    : "Unknown person";

                const characterName = member.character
                    ? member.character.name
                    : "Unknown character";

                return personName + " as " + characterName;
            });

        castParagraph.textContent = castNames.join(", ");
    } else {
        castParagraph.textContent = "Not available";
    }

    card.appendChild(castParagraph);

    // this is a link to the TVmaze.
    const link = document.createElement("a");
    link.href = show.url;
    link.textContent = "View on TVmaze";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    card.appendChild(link);

    return card;
}

// This searches within the TVmaze and displays up to 10 shows on the website
async function searchShows(query) {
    gallery.replaceChildren();

    const searchTerm = query.trim();

    if (searchTerm === "") {
        statusMesg.textContent = "Please enter a show title or keyword.";
        return;
    }

    statusMesg.textContent = "Searching for shows...";

    try {
        const searchURL =
            "https://api.tvmaze.com/search/shows?q=" +
            encodeURIComponent(searchTerm);

        const response = await fetch(searchURL);

        // Checks for HTTP errors.
        if (!response.ok) {
            if (response.status === 429) {
                throw new Error(
                    "Too many requests. Please wait a moment and try again."
                );
            }

            throw new Error("Unable to retrieve shows. Please try again.");
        }

        const results = await response.json();

        if (results.length === 0) {
            statusMesg.textContent =
                "No shows found. Try another search.";
            return;
        }

        // Display no more than 10 matching shows.
        const shows = results.slice(0, 10);

        statusMesg.textContent =
            "Found " + results.length +
            " matching shows. Displaying " + shows.length + ".";

        // Fetch cast information for each show.
        const castResults = await Promise.all(
            shows.map(async function (result) {
                try {
                    return await getCast(result.show.id);
                } catch (error) {
                    return [];
                }
            })
        );

        // this creates and displays each card of the show
        shows.forEach(function (result, index) {
            const card = createShowCard(
                result.show,
                castResults[index]
            );

            gallery.appendChild(card);
        });

    } catch (error) {
        gallery.replaceChildren();

        statusMesg.textContent = error.message.includes("429")
            ? error.message
            : "Something went wrong while loading shows. Please try again.";
    }
}