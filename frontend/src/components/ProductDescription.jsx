import './ProductDescription.css';

function ProductDescription({ auction }) {
  return (
    <section className="product-desc card">
      <h3>Product Description</h3>

      <p>
        {auction?.description || 'No description was provided for this auction.'}
      </p>

      {auction?.category && (
        <p>
          <strong>Category:</strong> {auction.category}
        </p>
      )}

    </section>
  );
}

export default ProductDescription;