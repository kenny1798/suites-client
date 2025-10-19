import React, { useState, useEffect } from 'react';
import { useTeam } from '@suite/core-context'; // Pastikan path import betul
import {toolsApi} from '@suite/api-clients'; // Pastikan path import betul

export default function ContactsPage() {
  // 1. Dapatkan team yang sedang aktif dari context
  const { activeTeam } = useTeam();
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. useEffect akan berjalan semula setiap kali 'activeTeam' berubah
  useEffect(() => {
    // Fungsi untuk dapatkan data dari backend
    const fetchContacts = async () => {
      // Pastikan ada team yang aktif sebelum buat panggilan API
      if (!activeTeam) {
        setContacts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // 3. Hantar 'activeTeam.id' sebagai query parameter
        const response = await toolsApi.get(`/api/salestrack/contacts?teamId=${activeTeam.id}`);
        setContacts(response.data);
      } catch (error) {
        console.error("Failed to fetch contacts for team:", activeTeam.id, error);
        setContacts([]); // Kosongkan data jika ada ralat
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [activeTeam]); // <-- Dependency array ni SANGAT PENTING!

  if (isLoading) {
    return <div>Loading contacts...</div>;
  }
  
  if (!activeTeam) {
    return <div>Please select a team to view contacts.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Contacts for {activeTeam.name}</h1>
      <ul>
        {contacts.map(contact => (
          <li key={contact.id}>{contact.name}</li>
        ))}
      </ul>
    </div>
  );
}