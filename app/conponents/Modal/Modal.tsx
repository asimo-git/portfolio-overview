"use client";
import { MAJOR_CURRENCIES } from "@/app/utils/constants";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./Modal.module.scss";

type Props = {
  onClose: () => void;
  onAdd: (asset: { name: string; quantity: number }) => void;
};

export default function Modal({ onClose, onAdd }: Props) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const handleEscPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  const handleOutsideClick = useCallback(
    (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscPress);
    window.addEventListener("click", handleOutsideClick);

    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleEscPress);
      window.removeEventListener("click", handleOutsideClick);
    };
  }, [handleEscPress, handleOutsideClick]);

  const handleSubmit = () => {
    if (!selectedCurrency || quantity <= 0) return;
    onAdd({ name: selectedCurrency, quantity });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div ref={modalRef} className={styles.modal}>
        <h2 className={styles.subtitle}>Добавить актив</h2>

        <label className={styles.label}>Выберите валюту:</label>
        <select
          value={selectedCurrency}
          onChange={(e) => {
            setSelectedCurrency(e.target.value);
          }}
          className={styles.input}
        >
          <option value="">Выбрать...</option>
          {MAJOR_CURRENCIES.map((item, index) => (
            <option key={index} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label className={styles.label}>Количество:</label>
        <input
          type="number"
          required
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className={styles.input}
          min="1"
        />

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Отмена
          </button>
          <button onClick={handleSubmit} className={styles.addBtn}>
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
