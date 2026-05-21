import React, { useState, useMemo } from 'react';
import Select from 'react-select';

const SearchableSelect = ({
                              options,
                              onChange,
                              placeholder = "Select an option",
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
                control: (provided) => ({
                    ...provided,
                    width: width,
                    borderRadius: '8px',
                    fontWeight: 'normal',
                    borderColor: '#ccc',
                    padding: '8px 12px',
                    fontSize: '1rem',
                    color: '#333',
                    backgroundColor: '#fff',
                    textAlign: 'left',
                    ':hover': {
                        borderColor: '#888',
                    },
                }),
                menu: (provided) => ({
                    ...provided,
                    width: menuWidth,
                    zIndex: 2000,
                    borderRadius: '8px',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                    marginTop: '4px',
                }),
                option: (provided, state) => ({
                    ...provided,
                    padding: '10px 12px',
                    backgroundColor: state.isSelected ? '#0A3E8C' : state.isFocused ? '#e0e8f8' : '#fff',
                    color: state.isSelected ? '#fff' : '#333',
                    textAlign: 'left',
                    cursor: 'pointer',
                    ':active': {
                        backgroundColor: '#d8e6fa',
                    },
                }),
                placeholder: (provided) => ({
                    ...provided,
                    color: '#888',
                    textAlign: 'left',
                }),
                singleValue: (provided) => ({
                    ...provided,
                    color: '#333',
                    textAlign: 'left',
                }),
                dropdownIndicator: (provided) => ({
                    ...provided,
                    color: '#888',
                    ':hover': {
                        color: '#333',
                    },
                }),
                clearIndicator: (provided) => ({
                    ...provided,
                    color: '#888',
                    ':hover': {
                        color: '#333',
                    },
                }),
            }}
        />
    );
};

export default SearchableSelect;
