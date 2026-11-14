// AdminService.js
import { db } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, addDoc, query, where, deleteDoc } from 'firebase/firestore';

const calculateLevelFromXP = (xp) => {
  if (xp < 500) return 1;

  const value = (2 * xp) / 500;
  const level = Math.floor((1 + Math.sqrt(1 + 4 * value)) / 2);
  
  return level;
};

const getTotalXPForLevel = (level) => {
  if (level <= 1) return 0;
  return 500 * (level - 1) * level / 2;
};

const getXPNeededForNextLevel = (level) => {
  return level * 500;
};

const getCurrentLevelProgress = (xp, level) => {
  const totalXPForCurrentLevel = getTotalXPForLevel(level);
  return xp - totalXPForCurrentLevel;
};

export async function createPlayerById(playerId, email = null, phoneNumber = null) {
  try {
    const userId = `player_${playerId}`;
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists()) {
      return { success: false, error: "Игрок с таким ID уже существует" };
    }
    
    await setDoc(doc(db, "users", userId), {
      playerId: playerId,
      email: email || `${playerId}@casino.local`,
      phoneNumber: phoneNumber,
      role: "player",
      balance: 0,
      level: 1,
      xp: 0,
      totalDeposit: 0,
      streakDays: 0,
      monthlyDeposits: 0,
      monthlyStreaks: 0,
      status: "active",
      createdAt: new Date().toISOString(),
    });
    
    return { success: true, userId, playerId };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function addDeposit(userId, amount) {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      const currentBalance = userData.balance || 0;
      const currentTotalDeposit = userData.totalDeposit || 0;
      const currentXP = userData.xp || 0;
      const currentLevel = userData.level || 1;
      const currentMonthlyDeposits = userData.monthlyDeposits || 0;
      
      const XP_PER_DEPOSIT = 500;
      const newXP = currentXP + XP_PER_DEPOSIT;
      
      const newLevel = calculateLevelFromXP(newXP);
      
      const newBalance = currentBalance + amount;
      const newTotalDeposit = currentTotalDeposit + amount;
      const newMonthlyDeposits = currentMonthlyDeposits + 1;
      const newMonthlyStreaks = Math.floor(newMonthlyDeposits / 5);
      
      const depositData = {
        amount: amount,
        date: new Date().toISOString(),
        type: 'deposit',
        xpEarned: XP_PER_DEPOSIT
      };
      
      const depositsRef = collection(db, "users", userId, "deposits");
      await addDoc(depositsRef, depositData);
      
      await updateDoc(userRef, {
        balance: newBalance,
        totalDeposit: newTotalDeposit,
        xp: newXP,
        level: newLevel,
        monthlyDeposits: newMonthlyDeposits,
        monthlyStreaks: newMonthlyStreaks,
        lastDeposit: {
          amount: amount,
          date: new Date().toISOString(),
          xpEarned: XP_PER_DEPOSIT
        }
      });
      
      console.log(`✅ Депозит добавлен: XP=${newXP}, Уровень=${newLevel}`);
      
      return { success: true, newLevel, newXP, xpEarned: XP_PER_DEPOSIT };
    }
    return { success: false, error: "User not found" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAllUsers() {
  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    const usersList = [];
    
    usersSnapshot.forEach((doc) => {
      usersList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, users: usersList };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getUserById(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return { success: true, user: { id: userDoc.id, ...userDoc.data() } };
    }
    return { success: false, error: "Пользователь не найден" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateUserStatus(userId, status) {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { status: status });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getUserDeposits(userId) {
  try {
    const depositsRef = collection(db, "users", userId, "deposits");
    const depositsSnapshot = await getDocs(depositsRef);
    const deposits = [];
    
    depositsSnapshot.forEach((doc) => {
      deposits.push({ id: doc.id, ...doc.data() });
    });
    
    return { 
      success: true, 
      deposits: deposits.sort((a, b) => new Date(b.date) - new Date(a.date)),
      totalAmount: deposits.reduce((sum, d) => sum + (d.amount || 0), 0),
      count: deposits.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getPlayersOnly() {
  try {
    const usersQuery = query(collection(db, "users"), where("role", "==", "player"));
    const usersSnapshot = await getDocs(usersQuery);
    const playersList = [];
    
    usersSnapshot.forEach((doc) => {
      playersList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, players: playersList };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getAdminsOnly() {
  try {
    const usersQuery = query(collection(db, "users"), where("role", "==", "admin"));
    const usersSnapshot = await getDocs(usersQuery);
    const adminsList = [];
    
    usersSnapshot.forEach((doc) => {
      adminsList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, admins: adminsList };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function deletePlayer(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists() && userDoc.data().role === 'admin') {
      return { success: false, error: "Нельзя удалить администратора" };
    }
    
    const depositsRef = collection(db, "users", userId, "deposits");
    const depositsSnapshot = await getDocs(depositsRef);
    const deletePromises = depositsSnapshot.docs.map(depositDoc => 
      deleteDoc(doc(db, "users", userId, "deposits", depositDoc.id))
    );
    await Promise.all(deletePromises);
    
    // Удаляем пользователя
    await deleteDoc(doc(db, "users", userId));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updatePlayerData(userId, updates) {
  try {
    const userRef = doc(db, "users", userId);
    const allowedUpdates = ['email', 'phoneNumber', 'balance', 'level', 'xp', 'status'];
    
    const filteredUpdates = {};
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        filteredUpdates[key] = updates[key];
      }
    }
    
    if (filteredUpdates.xp !== undefined) {
      filteredUpdates.level = calculateLevelFromXP(filteredUpdates.xp);
    }
    
    await updateDoc(userRef, filteredUpdates);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getGlobalStats() {
  try {
    const usersCollection = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollection);
    
    let totalPlayers = 0;
    let totalDeposits = 0;
    let totalBalance = 0;
    let topPlayers = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.role === 'player') {
        totalPlayers++;
        totalDeposits += userData.totalDeposit || 0;
        totalBalance += userData.balance || 0;
        topPlayers.push({
          id: doc.id,
          name: userData.playerId,
          level: userData.level || 1,
          totalDeposit: userData.totalDeposit || 0
        });
      }
    });
    
    topPlayers.sort((a, b) => b.totalDeposit - a.totalDeposit);
    
    return { 
      success: true, 
      stats: {
        totalPlayers,
        totalDeposits,
        totalBalance,
        averageDeposit: totalPlayers > 0 ? totalDeposits / totalPlayers : 0,
        topPlayers: topPlayers.slice(0, 10)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export {
  calculateLevelFromXP,
  getTotalXPForLevel,
  getXPNeededForNextLevel,
  getCurrentLevelProgress
};