document.addEventListener('DOMContentLoaded', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    const url = new URL(currentUrl);
    const parameters = url.searchParams;
    const parameterList = document.getElementById('parameterList');
    const urlContainer = document.getElementById('urlContainer');
    const fullUrlElement = document.getElementById('fullUrl');
    let parameterItems = [];
    let originalParameterItems = [];

    // 전체 URL 정보 추가 - 완전한 디코딩 적용
    const decodedUrl = decodeURIComponent(currentUrl);
    fullUrlElement.innerHTML = `
      <div class="full-url-content">${decodedUrl}</div>
      <button class="copy-button" data-url="${decodedUrl}">복사</button>
    `;

    // URL 복사 버튼 이벤트 리스너
    fullUrlElement.querySelector('.copy-button')?.addEventListener('click', function() {
      const urlToCopy = this.getAttribute('data-url');
      navigator.clipboard.writeText(urlToCopy).then(() => {
        const originalText = this.textContent;
        this.textContent = '복사됨!';
        this.classList.add('copy-success');
        
        setTimeout(() => {
          this.textContent = originalText;
          this.classList.remove('copy-success');
        }, 1500);
      });
    });

    // URL 파라미터 디코딩
    const decodedParams = new URLSearchParams();
    parameters.forEach((value, key) => {
      decodedParams.append(decodeURIComponent(key), decodeURIComponent(value));
    });
    
    const finalUrl = url.origin + url.pathname + '?' + decodedParams.toString() + url.hash;
    fullUrlElement.textContent = finalUrl;

    if (parameters.toString() === '') {
      parameterList.innerHTML = '<div class="no-parameters">URL에 파라미터가 없습니다.</div>';
      
      // URL 복사 버튼 이벤트 리스너
      document.querySelector('.copy-button')?.addEventListener('click', function() {
        const urlToCopy = this.getAttribute('data-url');
        navigator.clipboard.writeText(urlToCopy).then(() => {
          const originalText = this.textContent;
          this.textContent = '복사됨!';
          this.classList.add('copy-success');
          
          setTimeout(() => {
            this.textContent = originalText;
            this.classList.remove('copy-success');
          }, 1500);
        });
      });
      
      return;
    }

    // 파라미터 목록 추가
    parameters.forEach((value, key) => {
      const decodedKey = decodeURIComponent(key);
      const decodedValue = decodeURIComponent(value);
      const item = { key: decodedKey, value: decodedValue };
      parameterItems.push(item);
      originalParameterItems.push({...item});
    });

    function updateParameterList() {
      let html = '';
      parameterItems.forEach((item, index) => {
        html += `
          <div class="parameter-item" draggable="true" data-index="${index}">
            <div class="drag-handle">⋮⋮</div>
            <div class="parameter-content">
              <div class="parameter-key">${item.key}</div>
              <div class="parameter-value">${item.value}</div>
            </div>
            <button class="copy-button" data-key="${item.key}" data-value="${item.value}">복사</button>
          </div>
        `;
      });
      parameterList.innerHTML = html;
      setupDragAndDrop();
      updateUrl();
    }

    function updateUrl() {
      const baseUrl = url.origin + url.pathname;
      const newParams = new URLSearchParams();
      parameterItems.forEach(item => {
        newParams.append(item.key, item.value);
      });
      const newUrl = baseUrl + (newParams.toString() ? '?' + newParams.toString() : '');
      const decodedNewUrl = decodeURIComponent(newUrl);
      fullUrlElement.innerHTML = `
        <div class="full-url-content">${decodedNewUrl}</div>
        <button class="copy-button" data-url="${decodedNewUrl}">복사</button>
      `;
      
      // URL 복사 버튼 이벤트 리스너 재설정
      fullUrlElement.querySelector('.copy-button')?.addEventListener('click', function() {
        const urlToCopy = this.getAttribute('data-url');
        navigator.clipboard.writeText(urlToCopy).then(() => {
          const originalText = this.textContent;
          this.textContent = '복사됨!';
          this.classList.add('copy-success');
          
          setTimeout(() => {
            this.textContent = originalText;
            this.classList.remove('copy-success');
          }, 1500);
        });
      });
    }

    function setupDragAndDrop() {
      const items = document.querySelectorAll('.parameter-item');
      
      items.forEach(item => {
        item.addEventListener('dragstart', function(e) {
          this.classList.add('dragging');
          e.dataTransfer.setData('text/plain', this.getAttribute('data-index'));
          e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', function() {
          this.classList.remove('dragging');
          document.querySelectorAll('.parameter-item').forEach(item => {
            item.classList.remove('drag-over');
            item.classList.remove('drag-over-top');
            item.classList.remove('drag-over-bottom');
          });
        });

        item.addEventListener('dragenter', function(e) {
          e.preventDefault();
          const rect = this.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const threshold = rect.height / 2;
          
          this.classList.remove('drag-over-top', 'drag-over-bottom');
          if (y < threshold) {
            this.classList.add('drag-over-top');
          } else {
            this.classList.add('drag-over-bottom');
          }
        });

        item.addEventListener('dragleave', function() {
          this.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        item.addEventListener('dragover', function(e) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const rect = this.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const threshold = rect.height / 2;
          
          this.classList.remove('drag-over-top', 'drag-over-bottom');
          if (y < threshold) {
            this.classList.add('drag-over-top');
          } else {
            this.classList.add('drag-over-bottom');
          }
        });

        item.addEventListener('drop', function(e) {
          e.preventDefault();
          this.classList.remove('drag-over-top', 'drag-over-bottom');
          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
          const toIndex = parseInt(this.getAttribute('data-index'));
          const rect = this.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const threshold = rect.height / 2;
          
          if (fromIndex !== toIndex) {
            const item = parameterItems.splice(fromIndex, 1)[0];
            const insertIndex = y < threshold ? toIndex : toIndex + 1;
            parameterItems.splice(insertIndex, 0, item);
            updateParameterList();
          }
        });
      });
    }

    // 초기화 버튼 이벤트 리스너
    const resetButton = document.getElementById('resetButton');
    if (resetButton) {
      resetButton.addEventListener('click', function() {
        parameterItems = originalParameterItems.map(item => ({...item}));
        updateParameterList();
      });
    }

    // 복사 버튼 이벤트 리스너
    function setupCopyButtons() {
      document.querySelectorAll('.copy-button').forEach(button => {
        button.addEventListener('click', function() {
          let textToCopy;
          if (this.hasAttribute('data-url')) {
            textToCopy = this.getAttribute('data-url');
          } else {
            const key = this.getAttribute('data-key');
            const value = this.getAttribute('data-value');
            textToCopy = `${key}: ${value}`;
          }
          
          navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = this.textContent;
            this.textContent = '복사됨!';
            this.classList.add('copy-success');
            
            setTimeout(() => {
              this.textContent = originalText;
              this.classList.remove('copy-success');
            }, 1500);
          });
        });
      });
    }

    updateParameterList();
    setupCopyButtons();
  });
}); 