(function() {
  'use strict';

  class CustomDropdown {
    constructor(selectElement) {
      this.select = selectElement;
      this.options = Array.from(selectElement.options);
      this.selectedIndex = selectElement.selectedIndex;
      this.disabled = selectElement.disabled;
      
      this.createDropdown();
      this.bindEvents();
    }

    createDropdown() {
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'custom-dropdown-wrapper';
      if (this.disabled) {
        this.wrapper.classList.add('disabled');
      }

      this.button = document.createElement('button');
      this.button.type = 'button';
      this.button.className = 'custom-dropdown-button';
      this.button.setAttribute('aria-haspopup', 'listbox');
      this.button.setAttribute('aria-expanded', 'false');
      
      this.selectedText = document.createElement('span');
      this.selectedText.className = 'custom-dropdown-selected';
      this.updateSelectedText();
      
      this.arrow = document.createElement('span');
      this.arrow.className = 'custom-dropdown-arrow';
      this.arrow.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9L1 4h10z" fill="currentColor"/>
        </svg>
      `;
      
      this.button.appendChild(this.selectedText);
      this.button.appendChild(this.arrow);

      this.menu = document.createElement('div');
      this.menu.className = 'custom-dropdown-menu';
      this.menu.setAttribute('role', 'listbox');

      this.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'custom-dropdown-option';
        optionElement.setAttribute('role', 'option');
        optionElement.setAttribute('data-value', option.value);
        optionElement.setAttribute('data-index', index);
        
        if (option.selected) {
          optionElement.classList.add('selected');
        }
        
        if (option.disabled) {
          optionElement.classList.add('disabled');
        }
        
        optionElement.textContent = option.textContent.trim();
        optionElement.addEventListener('click', () => this.selectOption(index));
        
        this.menu.appendChild(optionElement);
      });

      this.wrapper.appendChild(this.button);
      this.wrapper.appendChild(this.menu);

      this.select.style.display = 'none';
      this.select.parentNode.insertBefore(this.wrapper, this.select);
    }

    updateSelectedText() {
      const selectedOption = this.options[this.selectedIndex];
      if (selectedOption) {
        this.selectedText.textContent = selectedOption.textContent.trim();
        this.button.setAttribute('aria-label', `Selected: ${selectedOption.textContent.trim()}`);
      }
    }

    selectOption(index) {
      const option = this.options[index];
      if (option.disabled) return;

      this.selectedIndex = index;
      
      this.select.selectedIndex = index;
      
      this.menu.querySelectorAll('.custom-dropdown-option').forEach((opt, i) => {
        opt.classList.toggle('selected', i === index);
      });
      
      this.updateSelectedText();
      this.close();

      const changeEvent = new Event('change', { bubbles: true });
      this.select.dispatchEvent(changeEvent);
    }

    open() {
      if (this.disabled) return;
      
      document.querySelectorAll('.custom-dropdown-wrapper').forEach(wrapper => {
        if (wrapper !== this.wrapper) {
          wrapper.classList.remove('open');
        }
      });
      
      this.wrapper.classList.add('open');
      this.button.setAttribute('aria-expanded', 'true');
      
      this.positionDropdown();
      
      const selectedOption = this.menu.querySelector('.custom-dropdown-option.selected');
      if (selectedOption) {
        selectedOption.scrollIntoView({ block: 'nearest' });
      }
    }

    positionDropdown() {
      this.menu.classList.remove('dropdown-up', 'dropdown-left', 'dropdown-right');
      this.menu.style.position = '';
      this.menu.style.top = '';
      this.menu.style.bottom = '';
      this.menu.style.left = '';
      this.menu.style.right = '';
      this.menu.style.width = '';
      
      const wasVisible = this.menu.style.display !== 'none';
      if (!wasVisible) {
        this.menu.style.visibility = 'hidden';
        this.menu.style.display = 'block';
      }
      
      const buttonRect = this.button.getBoundingClientRect();
      const menuRect = this.menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (!wasVisible) {
        this.menu.style.visibility = '';
      }
      
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      const menuHeight = menuRect.height || 240;
      
      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        this.menu.classList.add('dropdown-up');
      }
      
      const menuWidth = menuRect.width || buttonRect.width;
      
      if (buttonRect.left + menuWidth > viewportWidth) {
        this.menu.classList.add('dropdown-right');
      }

      else if (buttonRect.right - menuWidth < 0) {
        this.menu.classList.add('dropdown-left');
      }
      
      let scrollableParent = this.wrapper.closest('.card');
      if (!scrollableParent) {
        scrollableParent = this.wrapper.closest('[class*="card"], [class*="container"]');
      }
      
      if (scrollableParent) {
        const computedStyle = window.getComputedStyle(scrollableParent);
        if (computedStyle.overflow === 'hidden' || computedStyle.overflowY === 'hidden') {
          this.menu.style.position = 'fixed';
          const maxWidth = Math.min(buttonRect.width, viewportWidth - 16);
          this.menu.style.width = `${maxWidth}px`;
          this.menu.style.maxWidth = `${maxWidth}px`;
          this.menu.style.minWidth = '0';
          this.menu.style.zIndex = '10000';
          
          if (this.menu.classList.contains('dropdown-up')) {
            this.menu.style.bottom = `${viewportHeight - buttonRect.top + 4}px`;
            this.menu.style.top = 'auto';
          } else {
            this.menu.style.top = `${buttonRect.bottom + 4}px`;
            this.menu.style.bottom = 'auto';
          }
          
          if (this.menu.classList.contains('dropdown-right')) {
            this.menu.style.right = `${viewportWidth - buttonRect.right}px`;
            this.menu.style.left = 'auto';
          } else if (this.menu.classList.contains('dropdown-left')) {
            this.menu.style.left = `${buttonRect.left}px`;
            this.menu.style.right = 'auto';
          } else {
            this.menu.style.left = `${buttonRect.left}px`;
            this.menu.style.right = 'auto';
          }
          
          return;
        }
      }
      
      this.menu.style.zIndex = '';
    }

    close() {
      this.wrapper.classList.remove('open');
      this.button.setAttribute('aria-expanded', 'false');
      
      this.menu.style.position = '';
      this.menu.style.top = '';
      this.menu.style.bottom = '';
      this.menu.style.left = '';
      this.menu.style.right = '';
      this.menu.style.width = '';
      this.menu.style.maxWidth = '';
      this.menu.style.minWidth = '';
      this.menu.style.zIndex = '';
    }

    bindEvents() {
      this.button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.wrapper.classList.contains('open')) {
          this.close();
        } else {
          this.open();
        }
      });

      document.addEventListener('click', (e) => {
        if (!this.wrapper.contains(e.target)) {
          this.close();
        }
      });

      window.addEventListener('resize', () => {
        if (this.wrapper.classList.contains('open')) {
          this.positionDropdown();
        }
      });

      window.addEventListener('scroll', () => {
        if (this.wrapper.classList.contains('open') && this.menu.style.position === 'fixed') {
          this.positionDropdown();
        }
      }, true);

      this.button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.open();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.open();
          this.focusOption(0);
        }
      });

      this.menu.addEventListener('keydown', (e) => {
        const options = Array.from(this.menu.querySelectorAll('.custom-dropdown-option:not(.disabled)'));
        const currentIndex = options.findIndex(opt => opt === document.activeElement);
        
        switch(e.key) {
          case 'ArrowDown':
            e.preventDefault();
            const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
            this.focusOption(nextIndex);
            break;
          case 'ArrowUp':
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
            this.focusOption(prevIndex);
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (document.activeElement.classList.contains('custom-dropdown-option')) {
              const index = parseInt(document.activeElement.getAttribute('data-index'));
              this.selectOption(index);
            }
            break;
          case 'Escape':
            e.preventDefault();
            this.close();
            this.button.focus();
            break;
        }
      });

      const observer = new MutationObserver(() => {
        this.selectedIndex = this.select.selectedIndex;
        this.updateSelectedText();
        this.menu.querySelectorAll('.custom-dropdown-option').forEach((opt, i) => {
          opt.classList.toggle('selected', i === this.selectedIndex);
        });
      });

      observer.observe(this.select, { attributes: true, attributeFilter: ['selectedIndex'] });
    }

    focusOption(index) {
      const options = Array.from(this.menu.querySelectorAll('.custom-dropdown-option:not(.disabled)'));
      if (options[index]) {
        options[index].focus();
        options[index].scrollIntoView({ block: 'nearest' });
      }
    }

    setDisabled(disabled) {
      this.disabled = disabled;
      this.select.disabled = disabled;
      if (disabled) {
        this.wrapper.classList.add('disabled');
        this.close();
      } else {
        this.wrapper.classList.remove('disabled');
      }
    }
  }

  const convertedSelects = new WeakSet();

  function initCustomDropdowns() {
    const selects = document.querySelectorAll('select.input');
    selects.forEach(select => {
      if (!convertedSelects.has(select) && !select.closest('.custom-dropdown-wrapper')) {
        try {
          new CustomDropdown(select);
          convertedSelects.add(select);
        } catch (e) {
          console.error('Error creating custom dropdown:', e);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initCustomDropdowns, 50);
    });
  } else {
    setTimeout(initCustomDropdowns, 50);
  }

  const mainContent = document.getElementById('mainContent');
  if (mainContent) {
    const observer = new MutationObserver((mutations) => {
      let shouldInit = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              if (node.tagName === 'SELECT' && node.classList.contains('input')) {
                shouldInit = true;
              } else if (node.querySelectorAll) {
                const selects = node.querySelectorAll('select.input');
                if (selects.length > 0) {
                  shouldInit = true;
                }
              }
            }
          });
        }
      });
      
      if (shouldInit) {
        setTimeout(initCustomDropdowns, 10);
      }
    });

    observer.observe(mainContent, {
      childList: true,
      subtree: true
    });
  }

  window.initCustomDropdowns = initCustomDropdowns;
})();

