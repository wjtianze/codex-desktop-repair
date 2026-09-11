export function isInternalRetrievalImageMessage(message){
 const author=message?.author;
 return author?.role==="tool"&&typeof author.name==="string"&&/^file_search(?:[./]|$)/.test(author.name);
}
export function isCompactFileCitation(reference,presentation="auto"){
 if(presentation==="artifact-card"||presentation==="artifact-row"||reference?.type!=="file"||reference.source_type==="library_folder")return false;
 return reference.source==="my_files"||reference.input_pointer!=null||(
 typeof reference.matched_text==="string"&&reference.matched_text.includes("filecite"));
}
export const isCompactPdfCitation=isCompactFileCitation;
