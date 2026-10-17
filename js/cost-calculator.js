// Compare two user-supplied budgets. No default rates, market claims or uploads.
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cost-comparison');
  if (!form) return;

  const error = document.getElementById('comparison-error');
  const results = document.getElementById('comparison-results');
  const fields = Array.from(form.querySelectorAll('input[type="number"]'));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.hidden = true;
    let invalid;
    for (const field of fields) {
      const value = Number(field.value);
      const valid = field.value.trim() !== '' && field.validity.valid && Number.isFinite(value) && value >= 0;
      field.setAttribute('aria-invalid', String(!valid));
      if (!valid && !invalid) invalid = field;
    }
    if (invalid) {
      results.hidden = true;
      error.textContent = 'Enter a non-negative number in each field. Use zero where there is no cost.';
      error.hidden = false;
      invalid.focus();
      return;
    }

    const value = (id) => Number(document.getElementById(id).value);
    const internal = value('internal-hours') * value('internal-rate');
    const external = value('external-hours') * value('external-rate') + value('external-extra');
    if (!Number.isFinite(internal) || !Number.isFinite(external)) {
      results.hidden = true;
      error.textContent = 'Those figures are too large to compare. Check the hours and rates.';
      error.hidden = false;
      return;
    }
    const currency = document.getElementById('comparison-currency').value;
    const format = new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 2 });
    document.getElementById('internal-total').textContent = format.format(internal);
    document.getElementById('external-total').textContent = format.format(external);
    const difference = internal - external;
    document.getElementById('comparison-label').textContent = difference > 0
      ? 'External budget is lower by'
      : difference < 0 ? 'External budget is higher by' : 'Both budgets are equal';
    document.getElementById('comparison-difference').textContent = format.format(Math.abs(difference));
    results.hidden = false;
  });

  // Hide an old result when an assumption changes, including the currency.
  form.addEventListener('input', () => { results.hidden = true; });
  form.addEventListener('change', () => { results.hidden = true; });
});
