package seven.mtgol.payrec;

import android.app.Activity;
import android.os.Bundle;

import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.EditText;
import android.widget.Button;
import android.widget.ScrollView;
import android.text.InputType;

import android.view.inputmethod.InputMethodManager;
import java.util.Date;
import java.text.SimpleDateFormat;

import android.widget.TableLayout;
import android.widget.TableRow;

import android.content.ContentValues;
import android.database.sqlite.SQLiteOpenHelper;
import android.database.sqlite.SQLiteDatabase;
import android.database.SQLException;
import android.database.Cursor;

public class MainActivity extends Activity {
    public DataBox databox;
    public MainLayout main;
    public double amount;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        databox = new DataBox(this);
        amount = databox.moneyAccountingTotal();
        this.main = new MainLayout(this);
        setContentView(this.main);
    }

    public void hideKeyboard() {
        InputMethodManager inputMethodManager = (InputMethodManager)getSystemService(Activity.INPUT_METHOD_SERVICE);
        View view = getCurrentFocus();
        if(view == null) return;
        inputMethodManager.hideSoftInputFromWindow(view.getWindowToken(), 0);
    }

    private class MainLayout extends LinearLayout {
        private MainActivity activity;
        private EditText m_amount, m_description;
        private TextView m_total;
        private Button m_add;
        private LinearLayout m_list;

        public MainLayout(MainActivity activity) {
            super(activity);
            this.activity = activity;
            setOrientation(LinearLayout.VERTICAL);
            generateTitle();
            generateInputPanel();
            generateListPanel();
            updateAmount();
        }

        public void updateAmount() {
            m_total.setText(String.format("Count: %.2f", activity.amount));
        }

        public LinearLayout getMoneyAccountingPanel() {
            return m_list;
        }

        private void generateTitle() {
            TextView m_text = new TextView(activity);
            m_text.setText("PaymentRecord");
            addView(m_text);
        }

        private void generateInputPanel() {
            TableLayout table = new TableLayout(activity);
            TableRow row;
            TextView m_label;
            EditText m_text;

            row = new TableRow(activity);
            m_label = new TextView(activity);
            m_label.setText("Pay: ");
            m_text = new EditText(activity);
            m_text.setInputType(InputType.TYPE_CLASS_NUMBER | InputType.TYPE_NUMBER_FLAG_DECIMAL);
            m_text.setWidth(200);
            m_text.setPadding(2,0,2,0);
            m_amount = m_text;
            row.addView(m_label);
            row.addView(m_text);
            table.addView(row);

            row = new TableRow(activity);
            m_label = new TextView(activity);
            m_label.setText("Describe: ");
            m_text = new EditText(activity);
            m_text.setInputType(InputType.TYPE_CLASS_TEXT);
            m_text.setWidth(200);
            m_text.setPadding(2,0,2,0);
            m_description = m_text;
            row.addView(m_label);
            row.addView(m_text);
            table.addView(row);

            addView(table);

            m_add = new Button(activity);
            m_add.setText("Record");
            m_add.setWidth(300);
            m_add.setPadding(10,0,10,0);
            addView(m_add);

            m_total = new TextView(activity);
            m_total.setText("Count: ");
            addView(m_total);

            m_add.setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    long time = System.currentTimeMillis();
                    double amount = 0;
                    try {
                        amount = Double.parseDouble(m_amount.getText().toString());
                        if (amount <= 0) return;
                    } catch (Exception e) {
                        return;
                    }
                    String description = m_description.getText().toString();
                    long id = activity.databox.moneyAccountingPut(time, amount, description, activity.amount);
                    m_list.addView(
                        new DataItem(activity, id, time, amount, description), 0
                    );
                    activity.amount += amount;
                    updateAmount();
                    m_amount.setText("");
                    m_description.setText("");
                }
            });

        }

        private void generateListPanel() {
            ScrollView scroll = new ScrollView(activity);
            m_list = new LinearLayout(activity);
            m_list.setOrientation(LinearLayout.VERTICAL);
            if (activity.databox.moneyAccountingGetStart() >= 0) {
                Cursor cur = activity.databox.moneyAccountingGet();
                do {
                    long id = cur.getLong(cur.getColumnIndex("id"));
                    long time = cur.getLong(cur.getColumnIndex("time"));
                    double amount = cur.getDouble(cur.getColumnIndex("pay"));
                    String description = cur.getString(cur.getColumnIndex("obj"));
                    if (description == null) description = "";
                    m_list.addView(
                        new DataItem(activity, id, time, amount, description)
                    );
                } while (activity.databox.moneyAccountingGetNext() >= 0);
            }
            activity.databox.moneyAccountingGetEnd();
            scroll.addView(m_list);
            addView(scroll);
        }

        private LinearLayout generateListItem(int id, long time, double amount, String description) {
            return new DataItem(activity, id, time, amount, description);
        }
    }

    private class DataItem extends LinearLayout {
        private long id;
        private long time;
        private double amount;
        private String description;
        private MainActivity activity;

        public DataItem(MainActivity _activity, long _id, long _time, double _amount, String _description) {
            super(_activity);
            this.id = _id;
            this.time = _time;
            this.amount = _amount;
            this.description = _description;
            this.activity = _activity;

            Date date = new Date(time);
            SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm");
            String ta = formatter.format(date) + " paid " + amount + " for ";
            Button m_del = new Button(activity);
            m_del.setText("X");
            TextView m_text = new TextView(activity);
            m_text.setText(ta + "[ " + description + " ]");
            addView(m_del);
            addView(m_text);

            m_del.setOnClickListener(new View.OnClickListener() {
                public void onClick(View v) {
                    removeSelf();
                    activity.databox.moneyAccountingDel(id, activity.amount);
                    activity.amount -= amount;
                    activity.main.updateAmount();
                    activity = null;
                }
            });
        }

        public void removeSelf() {
            activity.main.getMoneyAccountingPanel().removeView(this);
        }
    }

    private class DataBox extends SQLiteOpenHelper {
        public DataBox(Activity activity) {
            super(activity, "seven_payrec", null, 1);
        }

        @Override
        public void onCreate(SQLiteDatabase db) {
            db.execSQL("create table money_accounting    (id integer primary key, time integer, pay real, obj text);");
            db.execSQL("create table money_accounting_ag (id integer primary key, time integer, total real);");
            db.execSQL("insert into  money_accounting_ag (id, time, total) values (0, 0, 0.0);");
        }

        @Override
        public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        }

        public void sleep() {
            SQLiteDatabase db;
            db  = this.getReadableDatabase();
            db.close();
            db = this.getWritableDatabase();
            db.close();
        }

        private Cursor moneyAccountingCursor;
        public int moneyAccountingGetStart() {
            SQLiteDatabase db = this.getReadableDatabase();
            moneyAccountingCursor = db.rawQuery("select * from money_accounting order by time desc;", null);
            return moneyAccountingCursor.moveToFirst()?0:-1;
        }
        public Cursor moneyAccountingGet() {
            return moneyAccountingCursor;
        }
        public int moneyAccountingGetNext() {
            return moneyAccountingCursor.moveToNext()?0:-1;
        }
        public int moneyAccountingGetEnd() {
            if (moneyAccountingCursor != null) moneyAccountingCursor.close();
            moneyAccountingCursor = null;
            return 0;
        }
        public double moneyAccountingTotal() {
            SQLiteDatabase db = this.getReadableDatabase();
            Cursor cursor = db.rawQuery("select id,total from money_accounting_ag where id=0;", null);
            cursor.moveToFirst();
            double r = cursor.getDouble(cursor.getColumnIndex("total"));
            cursor.close();
            return r;
        }
        public long moneyAccountingPut(long time, double amount, String description, double total) {
            SQLiteDatabase db = this.getWritableDatabase();
            ContentValues obj = new ContentValues();
            obj.put("time", time);
            obj.put("pay", amount);
            obj.put("obj", description);
            long id = db.insert("money_accounting", "id", obj);
            db.execSQL("update money_accounting_ag set total=" + (total + amount) + " where id=0;");
            return id;
        }
        public int moneyAccountingDel(long id, double total) {
            SQLiteDatabase db;
            db = this.getReadableDatabase();
            Cursor cursor;
            cursor = db.rawQuery("select id,pay from money_accounting where id=?;", new String[]{""+id});
            cursor.moveToFirst();
            double amount = cursor.getDouble(cursor.getColumnIndex("pay"));
            cursor.close();

            db = this.getWritableDatabase();
            db.execSQL("delete from money_accounting where id=" + id + ";");
            db.execSQL("update money_accounting_ag set total=" + (total - amount) + " where id=0;");
            return 0;
        }
        public int moneyAccountingClr() {
            SQLiteDatabase db = this.getWritableDatabase();
            db.execSQL("delete from money_accounting;");
            db.execSQL("update money_accounting_ag set total=0 where id=0;");
            return 0;
        }
    }
}
