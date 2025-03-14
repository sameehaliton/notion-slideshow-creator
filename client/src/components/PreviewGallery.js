// client/src/components/PreviewGallery.js
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './PreviewGallery.css';

const PreviewGallery = ({ images, onReorder }) => {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onReorder(items);
  };
  
  return (
    <div className="preview-gallery">
      <h2>Preview ({images.length} images)</h2>
      <p className="drag-instruction">Drag and drop to reorder images</p>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="images" direction="horizontal">
          {(provided) => (
            <div
              className="image-grid"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {images.map((image, index) => (
                <Draggable key={index} draggableId={`image-${index}`} index={index}>
                  {(provided) => (
                    <div
                      className="image-preview"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                      />
                      <div className="image-number">{index + 1}</div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default PreviewGallery;