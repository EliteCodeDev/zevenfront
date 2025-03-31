"use client";

import React, { useState, useEffect } from "react";
import { toast } from 'sonner';
const EditUserModal = ({ user, isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        id: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        country: "",
    });

    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                id: user.id || "",
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                phone: user.phone || "",
                country: user.country || "",
            });
        }
    }, [isOpen, user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${formData.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_API_TOKEN}`,
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error en la respuesta de Strapi:", errorData);
                toast.error("Error al actualizar los datos");
                throw new Error(`Error ${response.status} - ${errorData?.error?.message || "Error desconocido"}`);
            }

            toast.success("Datos actualizados correctamente");
            setTimeout(() => onClose(), 2000);
        } catch (error) {
            console.error("Error en handleSubmit:", error);
            toast.error("Hubo un error al actualizar");
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold mb-4">Editar Usuario</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    {/* Separa el nombre y apellido en dos inputs */}
                    <label>
                        <span className="text-sm">Nombre</span>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:text-zinc-200"
                        />
                    </label>

                    <label>
                        <span className="text-sm">Apellido</span>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:text-zinc-200"
                        />
                    </label>

                    <label>
                        <span className="text-sm">Email</span>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:text-zinc-200"
                        />
                    </label>

                    <label>
                        <span className="text-sm">Teléfono</span>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:text-zinc-200"
                        />
                    </label>

                    <label>
                        <span className="text-sm">País</span>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:text-zinc-200"
                        />
                    </label>

                    <div className="flex justify-end gap-2 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserModal;
