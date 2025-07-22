document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const form = document.getElementById('obraForm');
    const hasStoppagesRadio = document.querySelectorAll('input[name="hasStoppages"]');
    const hasExtensionRadio = document.querySelectorAll('input[name="hasExtension"]');
    const stoppagesContainer = document.getElementById('stoppagesContainer');
    const extensionContainer = document.getElementById('extensionContainer');
    const addStoppageBtn = document.getElementById('addStoppage');
    const stoppagesList = document.getElementById('stoppagesList');
    const stoppageTemplate = document.getElementById('stoppageTemplate');
    const resultsSection = document.getElementById('results');
    const exportPdfBtn = document.getElementById('exportPdf');
    
    // Toggle sections based on radio buttons
    hasStoppagesRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            stoppagesContainer.classList.toggle('hidden', this.value !== 'yes');
        });
    });
    
    hasExtensionRadio.forEach(radio => {
        radio.addEventListener('change', function() {
            extensionContainer.classList.toggle('hidden', this.value !== 'yes');
        });
    });
    
    // Add new stoppage
    addStoppageBtn.addEventListener('click', addStoppage);
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateFojas();
    });
    
    // Add initial event delegation for remove buttons
    stoppagesList.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-remove')) {
            e.target.closest('.stoppage-item').remove();
        }
    });
    
    // Export to PDF
    exportPdfBtn?.addEventListener('click', exportToPdf);
    
    // Add first stoppage if needed
    function addStoppage() {
        const clone = stoppageTemplate.content.cloneNode(true);
        const startDateInput = clone.querySelector('.stoppage-start');
        const endDateInput = clone.querySelector('.stoppage-end');
        
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];
        
        startDateInput.min = minDate;
        endDateInput.min = minDate;
        
        // Set end date to start date + 1 day
        startDateInput.addEventListener('change', function() {
            endDateInput.min = this.value;
            if (!endDateInput.value || new Date(endDateInput.value) < new Date(this.value)) {
                const nextDay = new Date(this.value);
                nextDay.setDate(nextDay.getDate() + 1);
                endDateInput.value = nextDay.toISOString().split('T')[0];
            }
        });
        
        stoppagesList.appendChild(clone);
    }
    
    // Main calculation function
    function calculateFojas() {
        // Get form values
        const startDate = new Date(document.getElementById('startDate').value);
        const initialDays = parseInt(document.getElementById('initialDays').value);
        const hasExtension = document.querySelector('input[name="hasExtension"]:checked').value === 'yes';
        const extensionDays = hasExtension ? parseInt(document.getElementById('extensionDays').value) : 0;
        
        // Get stoppages
        const stoppages = [];
        document.querySelectorAll('.stoppage-item').forEach(item => {
            const startDate = new Date(item.querySelector('.stoppage-start').value);
            const endDate = new Date(item.querySelector('.stoppage-end').value);
            stoppages.push({ start: startDate, end: endDate });
        });
        
        // Sort stoppages by start date
        stoppages.sort((a, b) => a.start - b.start);
        
        // Calculate dates
        const initialEndDate = addDays(new Date(startDate), initialDays - 1);
        const { endDate: endDateWithStoppages, totalStoppageDays } = calculateEndDateWithStoppages(new Date(startDate), initialDays, stoppages);
        const finalEndDate = extensionDays > 0 ? addDays(new Date(endDateWithStoppages), extensionDays) : new Date(endDateWithStoppages);
        
        // Generate fojas
        const fojas = generateFojas(new Date(startDate), finalEndDate, stoppages);
        
        // Display results
        displayResults(initialEndDate, endDateWithStoppages, finalEndDate, fojas);
    }
    
    // Calculate end date with stoppages
    function calculateEndDateWithStoppages(startDate, days, stoppages) {
        let currentDate = new Date(startDate);
        let remainingDays = days - 1; // Start date counts as the first day
        let totalStoppageDays = 0;

        while (remainingDays > 0) {
            // Move to next calendar day
            currentDate.setDate(currentDate.getDate() + 1);

            // Check if this day falls within a stoppage
            const isInStoppage = stoppages.some(stop => currentDate >= stop.start && currentDate <= stop.end);

            if (!isInStoppage) {
                remainingDays--;
            } else {
                totalStoppageDays++;
            }
        }

        return { endDate: currentDate, totalStoppageDays };
    }
    
    // Generate fojas by month, excluding stoppages
    function generateFojas(startDate, endDate, stoppages) {
        const fojas = [];
        let currentDate = new Date(startDate);
        let currentFoja = null;
        let fojaNumber = 1;
        
        // Helper function to check if a date is within any stoppage period
        const isInStoppage = (date) => {
            return stoppages.some(stop => {
                return date >= stop.start && date <= stop.end;
            });
        };
        
        // Helper function to get the first day of the month
        const firstDayOfMonth = (date) => {
            return new Date(date.getFullYear(), date.getMonth(), 1);
        };
        
        // Helper function to get the last day of the month
        const lastDayOfMonth = (date) => {
            return new Date(date.getFullYear(), date.getMonth() + 1, 0);
        };
        
        // Process each day from start to end date
        while (currentDate <= endDate) {
            // Skip days included in stoppages only
            if (!isInStoppage(currentDate)) {
                const monthStart = firstDayOfMonth(currentDate);
                const monthEnd = lastDayOfMonth(currentDate);
                
                // If we don't have a current foja or the foja is for a different month
                if (!currentFoja || 
                    currentDate.getMonth() !== currentFoja.start.getMonth() || 
                    currentDate.getFullYear() !== currentFoja.start.getFullYear()) {
                    
                    // Save previous foja if it exists
                    if (currentFoja) {
                        fojas.push(currentFoja);
                        fojaNumber++;
                    }
                    
                    // Create new foja
                    currentFoja = {
                        number: fojaNumber,
                        start: new Date(currentDate),
                        end: new Date(currentDate)
                    };
                } else {
                    // Update end date of current foja
                    currentFoja.end = new Date(currentDate);
                }
            }
            
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Add the last foja if it exists
        if (currentFoja) {
            fojas.push(currentFoja);
        }
        
        return fojas;
    }
    
    // Display results
    function displayResults(initialEndDate, endDateWithStoppages, finalEndDate, fojas) {
        // Update summary
        document.getElementById('initialEndDate').textContent = formatDate(initialEndDate);
        document.getElementById('endDateWithStoppages').textContent = formatDate(endDateWithStoppages);
        document.getElementById('finalEndDate').textContent = formatDate(finalEndDate);
        document.getElementById('totalFojas').textContent = fojas.length;
        
        // Update table
        const tbody = document.querySelector('#fojasTable tbody');
        tbody.innerHTML = '';
        
        fojas.forEach((foja, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${foja.number}</td>
                <td>${formatDate(foja.start)}</td>
                <td>${formatDate(foja.end)}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Show results section
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Export table to PDF
    function exportToPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(18);
        doc.text('Detalle de Fojas de Obra', 14, 22);
        
        // Summary
        doc.setFontSize(12);
        doc.text(`Fecha de inicio: ${document.getElementById('startDate').value}`, 14, 40);
        doc.text(`Plazo inicial: ${document.getElementById('initialDays').value} días`, 14, 48);
        doc.text(`Total de fojas: ${document.querySelectorAll('#fojasTable tbody tr').length}`, 14, 56);
        
        // Table
        const headers = [['Foja Nº', 'Desde', 'Hasta']];
        const rows = [];
        
        document.querySelectorAll('#fojasTable tbody tr').forEach(row => {
            const cols = Array.from(row.cells).map(cell => cell.textContent);
            rows.push(cols);
        });
        
        doc.autoTable({
            head: headers,
            body: rows,
            startY: 70,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            margin: { top: 70 }
        });
        
        // Save the PDF
        doc.save('fojas-obra.pdf');
    }
    
    // Helper function to add days to a date
    function addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
    
    // Helper function to format date as DD/MM/YYYY
    function formatDate(date) {
        if (!(date instanceof Date) || isNaN(date)) return '';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }
});
