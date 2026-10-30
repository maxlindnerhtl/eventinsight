import React, { useState, useMemo } from 'react';
import Select from 'react-select';

const SearchableSelect = ({
                              options,
                              onChange,
                              placeholder = "Auswählen…",
                              minInputLength = 1,
                              width = '600px',
                              menuWidth = '600px',
                              value
                          }) => {
    const [inputValue, setInputValue] = useState("");

    const filteredOptions = useMemo(() => {
        if (inputValue.length < minInputLength) return options;
        return options.filter(option => option.label.toLowerCase().includes(inputValue.toLowerCase()));
    }, [inputValue, options]);

    return (
        <Select
            options={filteredOptions}
            onChange={onChange}
            placeholder={placeholder}
            isClearable
            inputValue={inputValue}
            onInputChange={(value) => setInputValue(value)}
            value={value}  // Bind value to the selected option
            styles={{
                control: (provided, state) => ({
                    ...provided,
                    width: width,
                    maxWidth: '100%',
                    minHeight: 'var(--control-height)',
                    borderRadius: 'var(--radius-control)',
                    fontWeight: 'normal',
                    borderColor: state.isFocused ? 'var(--color-primary)' : 'var(--color-border)',
                    boxShadow: state.isFocused ? '0 0 0 1px var(--color-primary)' : 'none',
                    padding: '0 var(--space-1)',
                    fontSize: '1rem',
                    color: 'var(--color-text)',
                    backgroundColor: 'var(--color-surface)',
                    textAlign: 'left',
                    ':hover': {
                        borderColor: 'var(--color-primary)',
                    },
                }),
                menu: (provided) => ({
                    ...provided,
                    width: menuWidth,
                    maxWidth: '100%',
                    zIndex: 2000,
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'none',
                    marginTop: 'var(--space-1)',
                    overflow: 'hidden',
                }),
                option: (provided, state) => ({
                    ...provided,
                    padding: 'var(--space-3)',
                    backgroundColor: state.isSelected ? 'var(--color-primary)' : state.isFocused ? 'var(--color-row-hover)' : 'var(--color-surface)',
                    color: state.isSelected ? 'var(--color-surface)' : 'var(--color-text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    ':active': {
                        backgroundColor: 'var(--color-row-hover)',
                    },
                }),
                placeholder: (provided) => ({
                    ...provided,
                    color: 'var(--color-text-muted)',
                    textAlign: 'left',
                }),
                singleValue: (provided) => ({
                    ...provided,
                    color: 'var(--color-text)',
                    textAlign: 'left',
                }),
                dropdownIndicator: (provided) => ({
                    ...provided,
                    color: 'var(--color-text-muted)',
                    ':hover': {
                        color: 'var(--color-text)',
                    },
                }),
                clearIndicator: (provided) => ({
                    ...provided,
                    color: 'var(--color-text-muted)',
                    ':hover': {
                        color: 'var(--color-text)',
                    },
                }),
            }}
        />
    );
};

export default SearchableSelect;
