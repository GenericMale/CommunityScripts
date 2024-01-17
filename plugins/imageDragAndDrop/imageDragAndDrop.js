(function () {
    async function updateImage(node, image, query, getResponseURL) {
        const id = new URL(node.querySelector("a").href).pathname.split("/").pop();
        const response = await stash.callGQL({
            variables: {id, image},
            query,
        });

        const url = getResponseURL(response.data);
        if (url) node.querySelector("img").setAttribute("src", url);
    }

    async function attachDropHandler(type, query, getResponseURL) {
        stash.addEventListener(`page:${type}s`, () => {
            waitForElementByXpath(`//div[contains(@class, '${type}-card')]`, () => {
                for (const node of document.querySelectorAll(`.${type}-card`)) {
                    node.addEventListener("dragover", (e) => e.preventDefault());
                    node.addEventListener("drop", (e) => {
                        e.preventDefault();

                        let urlItem, imageItem;
                        for (const item of e.dataTransfer.items) {
                            if (item.type === "application/x-moz-file-promise-url") {
                                urlItem = item;
                            } else if (item.type.indexOf("image") === 0) {
                                imageItem = item.getAsFile();
                            }
                        }

                        const url = e.dataTransfer.getData("URL");
                        if (imageItem) {
                            const reader = new FileReader();
                            reader.onload = () =>
                                updateImage(node, reader.result, query, getResponseURL);
                            reader.readAsDataURL(imageItem);
                        } else if (urlItem) {
                            urlItem.getAsString((url) =>
                                updateImage(node, url, query, getResponseURL)
                            );
                        } else if (url) {
                            updateImage(node, url, query, getResponseURL);
                        }
                    });
                }
            });
        });
    }

    attachDropHandler(
        "scene",
        "mutation($id: ID!, $image: String){ sceneUpdate(input:{ id: $id, cover_image: $image }){ paths{ screenshot } }}",
        (data) => data?.sceneUpdate?.paths?.screenshot
    );
    attachDropHandler(
        "movie",
        "mutation($id: ID!, $image: String){ movieUpdate(input:{ id: $id, front_image: $image }){ front_image_path } }",
        (data) => data?.movieUpdate?.front_image_path
    );
    attachDropHandler(
        "performer",
        "mutation($id: ID!, $image: String){ performerUpdate(input:{ id: $id, image: $image }){ image_path } }",
        (data) => data?.performerUpdate?.image_path
    );
    attachDropHandler(
        "studio",
        "mutation($id: ID!, $image: String){ studioUpdate(input:{ id: $id, image: $image }){ image_path } }",
        (data) => data?.studioUpdate?.image_path
    );
    attachDropHandler(
        "tag",
        "mutation($id: ID!, $image: String){ tagUpdate(input:{ id: $id, image: $image }){ image_path } }",
        (data) => data?.tagUpdate?.image_path
    );
})();
