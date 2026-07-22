import './ui.css';

export default function FaqItem({ question, children, defaultOpen = false }) {
  return (
    <details className="faq-item" open={defaultOpen}>
      <summary>
        {question}
        <span className="faq-icon">+</span>
      </summary>
      <p>{children}</p>
    </details>
  );
}
